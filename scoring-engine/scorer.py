from __future__ import annotations

import asyncio
import json
from typing import Any

from llm_client import llm_client
from models import (
    ContentQualityBreakdown,
    ContentQualityScore,
    FairnessScore,
    RelevanceScore,
    ScoreRequest,
)

# Prompts for AI-based scoring modules
QUALITY_PROMPT = (
    "You are a content quality evaluator. Score this social media post on four dimensions: "
    "clarity (0-1), originality (0-1), sentiment_strength (0-1), depth (0-1). Return ONLY "
    "a JSON object with these four keys and a one-line reasoning string. No markdown, no preamble."
)

RELEVANCE_PROMPT = (
    "You are a trend relevance analyzer. Given a social media post and a list of currently "
    "trending posts, score how relevant this post is to current trends on a scale of 0.0 to 1.0. "
    "Return ONLY a JSON with keys: score (float), reasoning (string), matched_trends (list of strings). "
    "No markdown, no preamble."
)


async def score_content_quality(content_text: str) -> ContentQualityScore:
    """
    Evaluates the linguistic and structural quality of the post content using AI.
    """
    fallback = {
        "clarity": 0.5,
        "originality": 0.5,
        "sentiment_strength": 0.5,
        "depth": 0.5,
        "reasoning": "Fallback quality score used because AI scoring was unavailable.",
    }
    result = await llm_client.generate_json(
        system_prompt=QUALITY_PROMPT,
        user_prompt=f"Post content:\n{content_text}",
        fallback=fallback,
        max_tokens=180,
    )

    # Extract granular scores and compute average
    breakdown = ContentQualityBreakdown(
        clarity=_score_value(result.get("clarity")),
        originality=_score_value(result.get("originality")),
        sentiment_strength=_score_value(result.get("sentiment_strength")),
        depth=_score_value(result.get("depth")),
    )
    quality_score = (
        breakdown.clarity
        + breakdown.originality
        + breakdown.sentiment_strength
        + breakdown.depth
    ) / 4

    return ContentQualityScore(
        score=round(quality_score, 3),
        reasoning=str(result.get("reasoning") or "Content quality score generated."),
        breakdown=breakdown,
        error=_optional_error(result),
    )


async def score_relevance(content_text: str, trending_posts_sample: list[dict[str, Any]]) -> RelevanceScore:
    """
    Measures how well the post aligns with currently trending topics using AI context.
    """
    fallback = {
        "score": 0.5,
        "reasoning": "Fallback relevance score used because AI scoring was unavailable.",
        "matched_trends": [],
    }
    user_prompt = {
        "post_content": content_text,
        "trending_posts_sample": trending_posts_sample,
    }
    result = await llm_client.generate_json(
        system_prompt=RELEVANCE_PROMPT,
        user_prompt=json.dumps(user_prompt, ensure_ascii=True),
        fallback=fallback,
        max_tokens=220,
    )

    matched_trends = result.get("matched_trends")
    if not isinstance(matched_trends, list):
        matched_trends = []

    return RelevanceScore(
        score=round(_score_value(result.get("score")), 3),
        reasoning=str(result.get("reasoning") or "Relevance score generated."),
        matched_trends=[str(item) for item in matched_trends],
        error=_optional_error(result),
    )


async def score_fairness(post_exposure: float, avg_exposure: float) -> FairnessScore:
    """
    Calculates a fairness score based on exposure metrics. 
    Favors posts that have received less exposure than the system average.
    """
    score = compute_fairness(post_exposure, avg_exposure)
    exposure_delta = post_exposure - avg_exposure
    
    if exposure_delta < 0:
        reasoning = "Post has below-average exposure, deserves boost."
    elif exposure_delta > 0:
        reasoning = "Post already has above-average exposure."
    else:
        reasoning = "Post exposure is aligned with the system average."

    return FairnessScore(
        score=round(score, 3),
        reasoning=reasoning,
        exposure_delta=round(exposure_delta, 3),
    )


def compute_fairness(post_exposure: float, avg_exposure: float) -> float:
    """
    Mathematical formula for fairness scoring.
    Higher score means the post is more 'under-exposed'.
    """
    raw = 1 - (post_exposure / avg_exposure) if avg_exposure > 0 else 0.5
    return max(0.0, min(1.0, raw))


async def run_scoring_modules(request: ScoreRequest) -> tuple[ContentQualityScore, RelevanceScore, FairnessScore]:
    """
    Orchestrates the parallel execution of all scoring modules.
    """
    trending_posts = [post.model_dump() for post in request.trending_posts_sample]
    
    # Define tasks for parallel execution
    quality_task = score_content_quality(request.content_text)
    relevance_task = score_relevance(request.content_text, trending_posts)
    fairness_task = score_fairness(
        request.post_current_exposure,
        request.avg_exposure_all_posts,
    )
    
    # Run all tasks concurrently
    return await asyncio.gather(quality_task, relevance_task, fairness_task)


def compute_final_score(quality_score: float, relevance_score: float, fairness_score: float) -> float:
    """
    Aggregates pillar scores into a single final score using pre-defined weights.
    Weights: Quality (35%), Relevance (40%), Fairness (25%).
    """
    return round((0.35 * quality_score) + (0.40 * relevance_score) + (0.25 * fairness_score), 3)


def determine_rank_tier(final_score: float) -> str:
    """
    Maps the final numerical score to a qualitative rank tier.
    """
    if final_score >= 0.70:
        return "HIGH"
    if final_score >= 0.45:
        return "MEDIUM"
    return "LOW"


def _score_value(value: Any) -> float:
    """
    Safely converts a value to a float between 0.0 and 1.0.
    """
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.5
    return max(0.0, min(1.0, numeric))


def _optional_error(result: dict[str, Any]) -> str | None:
    """
    Extracts optional error messages from engine results.
    """
    error = result.get("error")
    return str(error) if error else None
