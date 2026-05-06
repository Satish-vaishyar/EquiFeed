# EquiFeed Scoring Engine

Production-ready FastAPI scoring service for EquiFeed FS-07. The service receives social post content, scores it across content quality, trend relevance, and fairness, then returns a structured ranking response.

For complete developer documentation, see [`APPLICATION_DOCUMENTATION.md`](APPLICATION_DOCUMENTATION.md).

## Features

- `POST /score` scoring endpoint
- `GET /health` health check
- Async parallel scoring with `asyncio.gather()`
- NVIDIA OpenAI-compatible LLM scoring for quality, relevance, and low-score feedback
- Pure math fairness scoring
- Safe JSON parsing and graceful LLM fallbacks
- CORS enabled for Vercel or other frontend origins
- Cloud Run-ready Dockerfile
- Stateless design with no database dependency

## Local Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your NVIDIA key in `.env`:

```bash
NVIDIA_API_KEY=your_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL_NAME=openai/gpt-oss-20b
LLM_MAX_TOKENS=256
LLM_REASONING_EFFORT=low
```

Run locally:

```bash
uvicorn main:app --reload --port 8080
```

Open:

- `http://localhost:8080`
- `http://localhost:8080/health`
- `http://localhost:8080/docs`

## Example Request

```bash
curl -X POST "http://localhost:8080/score" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "post-123",
    "creator_id": "creator-456",
    "content_text": "AI tools are changing how small teams ship products faster, but fairness in ranking still matters.",
    "content_type": "text",
    "image_url": null,
    "video_url": null,
    "topic_tags": ["AI", "productivity", "fairness"],
    "created_at": "2026-05-05T10:00:00Z",
    "total_posts_in_system": 500,
    "post_current_exposure": 120,
    "avg_exposure_all_posts": 340,
    "trending_posts_sample": [
      {"title": "AI agents for software teams", "tags": ["AI", "agents"], "engagement": 9400},
      {"title": "Ranking fairness in social platforms", "tags": ["fairness", "social"], "engagement": 7200}
    ]
  }'
```

## Scoring Formula

```python
final_score = (0.35 * quality_score) + (0.40 * relevance_score) + (0.25 * fairness_score)
```

Rank tiers:

- `HIGH`: final score >= 0.70
- `MEDIUM`: final score >= 0.45
- `LOW`: final score < 0.45

Boost recommendation is `true` only for `HIGH` posts.

## LLM Fallback Behavior

LLM requests use a 10-second timeout. If the API key is missing, a timeout occurs, or the model returns malformed JSON, the affected AI module returns a safe fallback score of `0.5` with an `error` field. The API response never crashes because of malformed model output.

The default LLM configuration is tuned for API latency: `openai/gpt-oss-20b`, short JSON responses, low `max_tokens`, deterministic temperature, and `LLM_REASONING_EFFORT=low`.

## Deploy to Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/scoring-engine
gcloud run deploy scoring-engine \
  --image gcr.io/YOUR_PROJECT/scoring-engine \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NVIDIA_API_KEY=YOUR_NVIDIA_API_KEY,NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1,NVIDIA_MODEL_NAME=openai/gpt-oss-20b
```

After deployment, the frontend can call:

```text
POST https://YOUR_CLOUD_RUN_URL/score
```

## Response Shape

The response includes:

- post id and scoring timestamp
- content quality score with four-part breakdown
- relevance score with matched trends
- fairness score with exposure delta
- final weighted score
- rank tier
- boost recommendation
- low-score feedback report when applicable
