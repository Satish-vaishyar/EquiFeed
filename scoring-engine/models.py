from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class ContentType(str, Enum):
    text = "text"
    image = "image"
    video = "video"


class TrendingPost(BaseModel):
    title: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    engagement: int = Field(..., ge=0)


class ScoreRequest(BaseModel):
    post_id: str = Field(..., min_length=1)
    creator_id: str = Field(..., min_length=1)
    content_text: str = Field(..., min_length=1)
    content_type: ContentType
    image_url: HttpUrl | None = None
    video_url: HttpUrl | None = None
    topic_tags: list[str] = Field(default_factory=list)
    created_at: datetime
    total_posts_in_system: int = Field(..., ge=0)
    post_current_exposure: int = Field(..., ge=0)
    avg_exposure_all_posts: float = Field(..., ge=0)
    trending_posts_sample: list[TrendingPost] = Field(default_factory=list)


class ContentQualityBreakdown(BaseModel):
    clarity: float = Field(..., ge=0.0, le=1.0)
    originality: float = Field(..., ge=0.0, le=1.0)
    sentiment_strength: float = Field(..., ge=0.0, le=1.0)
    depth: float = Field(..., ge=0.0, le=1.0)


class ContentQualityScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    breakdown: ContentQualityBreakdown
    error: str | None = None


class RelevanceScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    matched_trends: list[str] = Field(default_factory=list)
    error: str | None = None


class FairnessScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    exposure_delta: float


class Scores(BaseModel):
    content_quality: ContentQualityScore
    relevance: RelevanceScore
    fairness: FairnessScore


class WeightsUsed(BaseModel):
    alpha: float = 0.35
    beta: float = 0.40
    gamma: float = 0.25


class RankTier(str, Enum):
    high = "HIGH"
    medium = "MEDIUM"
    low = "LOW"


class FeedbackReportContent(BaseModel):
    summary: str
    weak_pillars: list[str]
    suggestions: list[str]
    next_post_tips: str


class FeedbackReport(BaseModel):
    generated: bool
    report: FeedbackReportContent | None = None
    error: str | None = None


class ScoreResponse(BaseModel):
    post_id: str
    scored_at: datetime
    scores: Scores
    final_score: float = Field(..., ge=0.0, le=1.0)
    weights_used: WeightsUsed
    rank_tier: RankTier
    boost_recommended: bool
    feedback_report: FeedbackReport


class ServiceInfo(BaseModel):
    service: str
    version: str
    status: str
    endpoints: dict[str, str]


JsonDict = dict[str, Any]
