from __future__ import annotations

import logging
import time
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from feedback import empty_feedback_report, generate_feedback_report
from models import (
    RankTier,
    ScoreRequest,
    ScoreResponse,
    Scores,
    ServiceInfo,
    WeightsUsed,
)
from scorer import compute_final_score, determine_rank_tier, run_scoring_modules

# Configure logging for the scoring engine
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("equifeed-scoring-engine")

# Initialize FastAPI application
app = FastAPI(
    title="EquiFeed Content Scoring Engine",
    version="1.0.0",
    description="Stateless API for scoring social content quality, trend relevance, and exposure fairness.",
)

# Enable CORS for all origins to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=ServiceInfo)
async def root() -> ServiceInfo:
    """
    Returns service information and available endpoints.
    """
    return ServiceInfo(
        service="equifeed-scoring-engine",
        version="1.0.0",
        status="ok",
        endpoints={
            "health": "GET /health",
            "score": "POST /score",
            "docs": "GET /docs",
        },
    )


@app.get("/health")
async def health() -> dict[str, str]:
    """
    Simple health check endpoint for monitoring.
    """
    return {"status": "ok", "service": "equifeed-scoring-engine"}


@app.post("/score", response_model=ScoreResponse)
async def score_post(payload: ScoreRequest, request: Request) -> ScoreResponse:
    """
    Scores a single post based on quality, relevance, and fairness.
    
    1. Runs three parallel scoring modules (AI and logic-based).
    2. Computes a weighted final score.
    3. Categorizes the post into a rank tier (HIGH, MEDIUM, LOW).
    4. Generates a feedback report for LOW-ranking posts.
    """
    started = time.perf_counter()

    # Step 1: Run core scoring modules in parallel
    quality, relevance, fairness = await run_scoring_modules(payload)
    scores = Scores(content_quality=quality, relevance=relevance, fairness=fairness)

    # Step 2: Aggregate scores and determine ranking
    final_score = compute_final_score(quality.score, relevance.score, fairness.score)
    rank_tier_value = determine_rank_tier(final_score)
    rank_tier = RankTier(rank_tier_value)
    boost_recommended = rank_tier == RankTier.high

    # Step 3: Generate detailed feedback only for underperforming content
    if rank_tier == RankTier.low:
        feedback_report = await generate_feedback_report(payload, scores, final_score)
    else:
        feedback_report = empty_feedback_report()

    # Step 4: Construct final response
    response = ScoreResponse(
        post_id=payload.post_id,
        scored_at=datetime.now(UTC),
        scores=scores,
        final_score=final_score,
        weights_used=WeightsUsed(),
        rank_tier=rank_tier,
        boost_recommended=boost_recommended,
        feedback_report=feedback_report,
    )

    # Log metrics for monitoring and debugging
    latency_ms = round((time.perf_counter() - started) * 1000, 2)
    logger.info(
        "score_request post_id=%s client=%s quality=%.3f relevance=%.3f fairness=%.3f final_score=%.3f rank_tier=%s latency_ms=%.2f",
        payload.post_id,
        request.client.host if request.client else "unknown",
        quality.score,
        relevance.score,
        fairness.score,
        final_score,
        rank_tier.value,
        latency_ms,
    )

    return response
