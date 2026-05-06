from __future__ import annotations

import json
from typing import Any

from llm_client import llm_client
from models import FeedbackReport, FeedbackReportContent, ScoreRequest, Scores

# Prompt for generating constructive feedback via AI
FEEDBACK_PROMPT = (
    "You are a constructive social media content coach. The post received a LOW rank tier. "
    "Generate actionable feedback as JSON only with keys: summary (string), weak_pillars "
    "(list of strings), suggestions (list of strings), next_post_tips (string). No markdown, no preamble."
)


async def generate_feedback_report(request: ScoreRequest, scores: Scores, final_score: float) -> FeedbackReport:
    """
    Generates a detailed AI feedback report for content that underperformed.
    Analyzes the post content and pillar scores to provide specific improvement tips.
    """
    weak_pillars = _weak_pillars(scores)
    fallback = {
        "summary": "Your post scored low because one or more scoring pillars need improvement.",
        "weak_pillars": weak_pillars,
        "suggestions": [
            "Lead with the clearest insight in the first line.",
            "Connect the post to current trend topics using specific keywords or hashtags.",
            "Add more concrete detail so the audience understands why the post matters.",
        ],
        "next_post_tips": "Focus on a shorter, clearer caption with one strong idea and one call-to-action.",
    }

    # Context payload for the LLM
    payload: dict[str, Any] = {
        "post_content": request.content_text,
        "topic_tags": request.topic_tags,
        "trending_posts_sample": [post.model_dump() for post in request.trending_posts_sample],
        "scores": scores.model_dump(),
        "final_score": final_score,
    }

    result = await llm_client.generate_json(
        system_prompt=FEEDBACK_PROMPT,
        user_prompt=json.dumps(payload, ensure_ascii=True),
        fallback=fallback,
        max_tokens=600,
    )

    # Reconstruct report from AI result or fallback
    report = FeedbackReportContent(
        summary=str(result.get("summary") or fallback["summary"]),
        weak_pillars=_list_of_strings(result.get("weak_pillars")) or weak_pillars,
        suggestions=_list_of_strings(result.get("suggestions")) or fallback["suggestions"],
        next_post_tips=str(result.get("next_post_tips") or fallback["next_post_tips"]),
    )
    error = result.get("error")

    return FeedbackReport(
        generated=True,
        report=report,
        error=str(error) if error else None,
    )


def empty_feedback_report() -> FeedbackReport:
    """
    Returns an empty report container for posts that don't require feedback.
    """
    return FeedbackReport(generated=False, report=None)


def _weak_pillars(scores: Scores) -> list[str]:
    """
    Identifies which scoring categories (pillars) fell below the 'good' threshold.
    """
    pillars = []
    if scores.content_quality.score < 0.45:
        pillars.append("content_quality")
    if scores.relevance.score < 0.45:
        pillars.append("relevance")
    if scores.fairness.score < 0.45:
        pillars.append("fairness")
    return pillars or ["content_quality", "relevance", "fairness"]


def _list_of_strings(value: Any) -> list[str]:
    """
    Safely ensures a value is a list of clean strings.
    """
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]
