# EquiFeed Scoring Engine Documentation

## 1. Application Overview

The EquiFeed Scoring Engine is a stateless FastAPI service that evaluates social media posts and returns a structured ranking result. It is designed for EquiFeed FS-07, where posts need to be scored across three pillars:

- Content quality
- Trend relevance
- Exposure fairness

The service exposes a small HTTP API. The main endpoint accepts a post payload, runs the scoring modules, combines the scores using fixed weights, assigns a rank tier, and optionally generates feedback for low-ranking posts.

The application has no database dependency. It relies on request payload data and, when configured, an OpenAI-compatible NVIDIA-hosted LLM endpoint for AI-assisted scoring.

## 2. Repository Structure

```text
scoring-engine/
  main.py                 FastAPI app, routes, orchestration, logging
  models.py               Pydantic request and response schemas
  scorer.py               Quality, relevance, fairness, and final scoring logic
  llm_client.py           LLM client wrapper, JSON parsing, fallback handling
  feedback.py             Low-score feedback generation
  requirements.txt        Python dependencies
  Dockerfile              Container image definition
  README.md               Quick-start documentation
  .env.example            Environment variable template
  tests/
    README.md             Demo test instructions
    demo_queries.py       API smoke/demo validation script
```

Runtime-generated files such as `server*.log`, `server*.pid`, `__pycache__/`, `.venv/`, `.uv-cache/`, and `.uv-python/` are local execution artifacts and are not part of the application source.

## 3. Runtime Architecture

At runtime, the request flow is:

```text
Client
  |
  | POST /score
  v
FastAPI route in main.py
  |
  | validates request with ScoreRequest
  v
run_scoring_modules() in scorer.py
  |
  | runs content quality, relevance, and fairness scoring concurrently
  v
compute_final_score()
  |
  | applies fixed weighted formula
  v
determine_rank_tier()
  |
  | LOW posts trigger generate_feedback_report()
  v
ScoreResponse returned to client
```

The scoring modules are asynchronous and are launched together with `asyncio.gather()`. Content quality and relevance use the LLM client. Fairness is computed locally with deterministic math.

## 4. Main Application Entrypoint

File: `main.py`

`main.py` creates the FastAPI application, configures CORS, defines routes, and coordinates scoring.

Application metadata:

- Title: `EquiFeed Content Scoring Engine`
- Version: `1.0.0`
- Description: `Stateless API for scoring social content quality, trend relevance, and exposure fairness.`

CORS is currently configured with:

```python
allow_origins=["*"]
allow_credentials=False
allow_methods=["*"]
allow_headers=["*"]
```

This is convenient for frontend integration and demos. For production with a known frontend domain, restrict `allow_origins` to trusted origins.

## 5. API Endpoints

### 5.1 GET /

Returns service metadata and the available endpoint map.

Response model: `ServiceInfo`

Example response:

```json
{
  "service": "equifeed-scoring-engine",
  "version": "1.0.0",
  "status": "ok",
  "endpoints": {
    "health": "GET /health",
    "score": "POST /score",
    "docs": "GET /docs"
  }
}
```

### 5.2 GET /health

Returns a lightweight health check response.

Example response:

```json
{
  "status": "ok",
  "service": "equifeed-scoring-engine"
}
```

Use this endpoint for simple uptime checks, deployment probes, and smoke validation.

### 5.3 POST /score

Scores a submitted social post.

Request model: `ScoreRequest`

Response model: `ScoreResponse`

Example request:

```json
{
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
    {
      "title": "AI agents for software teams",
      "tags": ["AI", "agents"],
      "engagement": 9400
    },
    {
      "title": "Ranking fairness in social platforms",
      "tags": ["fairness", "social"],
      "engagement": 7200
    }
  ]
}
```

Example response shape:

```json
{
  "post_id": "post-123",
  "scored_at": "2026-05-05T10:00:02.123456Z",
  "scores": {
    "content_quality": {
      "score": 0.82,
      "reasoning": "Clear, relevant, and specific.",
      "breakdown": {
        "clarity": 0.9,
        "originality": 0.75,
        "sentiment_strength": 0.8,
        "depth": 0.83
      },
      "error": null
    },
    "relevance": {
      "score": 0.88,
      "reasoning": "Matches AI and ranking fairness trends.",
      "matched_trends": ["AI agents for software teams", "Ranking fairness in social platforms"],
      "error": null
    },
    "fairness": {
      "score": 0.647,
      "reasoning": "Post has below-average exposure, deserves boost.",
      "exposure_delta": -220
    }
  },
  "final_score": 0.799,
  "weights_used": {
    "alpha": 0.35,
    "beta": 0.4,
    "gamma": 0.25
  },
  "rank_tier": "HIGH",
  "boost_recommended": true,
  "feedback_report": {
    "generated": false,
    "report": null,
    "error": null
  }
}
```

## 6. Data Models

File: `models.py`

The application uses Pydantic models for validation and documentation. FastAPI also uses these models to generate the interactive OpenAPI documentation at `/docs`.

### 6.1 Request Models

#### ContentType

Allowed values:

- `text`
- `image`
- `video`

#### TrendingPost

Represents one sample trend used by the relevance scorer.

Fields:

- `title`: required non-empty string
- `tags`: list of strings, defaults to an empty list
- `engagement`: integer greater than or equal to `0`

#### ScoreRequest

Main request body for `POST /score`.

Fields:

- `post_id`: required non-empty string
- `creator_id`: required non-empty string
- `content_text`: required non-empty string
- `content_type`: required `ContentType`
- `image_url`: optional valid HTTP URL
- `video_url`: optional valid HTTP URL
- `topic_tags`: list of strings, defaults to an empty list
- `created_at`: datetime
- `total_posts_in_system`: integer greater than or equal to `0`
- `post_current_exposure`: integer greater than or equal to `0`
- `avg_exposure_all_posts`: float greater than or equal to `0`
- `trending_posts_sample`: list of `TrendingPost`, defaults to an empty list

### 6.2 Response Models

#### ContentQualityBreakdown

Contains the four component scores returned by the content quality scorer:

- `clarity`
- `originality`
- `sentiment_strength`
- `depth`

Each value must be between `0.0` and `1.0`.

#### ContentQualityScore

Fields:

- `score`: average of the four quality breakdown values
- `reasoning`: human-readable explanation
- `breakdown`: `ContentQualityBreakdown`
- `error`: optional fallback/error marker

#### RelevanceScore

Fields:

- `score`: trend relevance score from `0.0` to `1.0`
- `reasoning`: human-readable explanation
- `matched_trends`: list of matching trend names or descriptions
- `error`: optional fallback/error marker

#### FairnessScore

Fields:

- `score`: exposure fairness score from `0.0` to `1.0`
- `reasoning`: explanation based on exposure compared with average exposure
- `exposure_delta`: `post_current_exposure - avg_exposure_all_posts`

#### Scores

Groups all three pillar scores:

- `content_quality`
- `relevance`
- `fairness`

#### WeightsUsed

Documents the scoring weights used for the final score:

- `alpha`: `0.35` for content quality
- `beta`: `0.40` for relevance
- `gamma`: `0.25` for fairness

#### RankTier

Allowed values:

- `HIGH`
- `MEDIUM`
- `LOW`

#### FeedbackReport

Returned for every score response. For `LOW` posts, `generated` is true and `report` contains feedback content. For `MEDIUM` and `HIGH` posts, `generated` is false and `report` is null.

## 7. Scoring Logic

File: `scorer.py`

The scoring engine calculates three pillar scores and one final weighted score.

### 7.1 Content Quality Scoring

Function: `score_content_quality(content_text)`

This module asks the LLM to evaluate the post on:

- Clarity
- Originality
- Sentiment strength
- Depth

The final content quality score is the average:

```text
content_quality = (clarity + originality + sentiment_strength + depth) / 4
```

The result is rounded to three decimal places.

If the LLM is unavailable or returns unusable data, the module uses a fallback score of `0.5` for each quality dimension.

### 7.2 Trend Relevance Scoring

Function: `score_relevance(content_text, trending_posts_sample)`

This module asks the LLM to compare the submitted post with the provided trend sample. It returns:

- A relevance score from `0.0` to `1.0`
- A short reasoning string
- A list of matched trends

If the LLM is unavailable or returns unusable data, the module uses a fallback relevance score of `0.5` and an empty matched trend list.

### 7.3 Exposure Fairness Scoring

Function: `score_fairness(post_exposure, avg_exposure)`

Fairness is computed locally without an LLM:

```text
raw_fairness = 1 - (post_exposure / avg_exposure)
```

The final fairness score is clamped to the range `0.0` to `1.0`.

If `avg_exposure` is `0`, fairness defaults to `0.5`.

Interpretation:

- A post with below-average exposure receives a higher fairness score.
- A post with above-average exposure receives a lower fairness score.
- A post equal to average exposure receives a score of `0.0` from the formula because `1 - 1 = 0`.

Examples:

```text
post exposure = 120
average exposure = 340
fairness = 1 - (120 / 340) = 0.647
```

```text
post exposure = 490
average exposure = 340
fairness = 1 - (490 / 340) = -0.441, clamped to 0.0
```

### 7.4 Parallel Scoring

Function: `run_scoring_modules(request)`

The application runs the three scoring modules concurrently:

```python
return await asyncio.gather(quality_task, relevance_task, fairness_task)
```

This keeps latency lower than running LLM-backed quality and relevance scoring one after another.

### 7.5 Final Score

Function: `compute_final_score(quality_score, relevance_score, fairness_score)`

Formula:

```text
final_score = (0.35 * quality_score) + (0.40 * relevance_score) + (0.25 * fairness_score)
```

The final score is rounded to three decimal places.

### 7.6 Rank Tier

Function: `determine_rank_tier(final_score)`

Tier thresholds:

```text
HIGH   final_score >= 0.70
MEDIUM final_score >= 0.45 and < 0.70
LOW    final_score < 0.45
```

Boost recommendation:

```text
boost_recommended = true only when rank_tier is HIGH
```

## 8. LLM Integration

File: `llm_client.py`

The LLM client uses the `openai` Python SDK against an OpenAI-compatible base URL. By default, the service targets NVIDIA's hosted API.

### 8.1 Environment Variables

Supported variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NVIDIA_API_KEY` | Primary API key used for NVIDIA endpoint access | none |
| `OPENAI_API_KEY` | Fallback API key if `NVIDIA_API_KEY` is missing | none |
| `NVIDIA_BASE_URL` | OpenAI-compatible API base URL | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL_NAME` | Model name passed to chat completions | `openai/gpt-oss-120b` in code, `openai/gpt-oss-20b` in `.env.example` |
| `LLM_TIMEOUT_SECONDS` | Timeout for each LLM request | `10` |
| `LLM_MAX_TOKENS` | Default maximum output tokens | `256` |
| `LLM_REASONING_EFFORT` | Extra request body value for reasoning effort | `low` |

Note: the source code default model and `.env.example` model differ. The code defaults to `openai/gpt-oss-120b`, while `.env.example` recommends `openai/gpt-oss-20b`. In real deployments, set `NVIDIA_MODEL_NAME` explicitly to avoid ambiguity.

### 8.2 Request Settings

LLM calls use:

- `temperature=0`
- `stream=False`
- `response_format={"type": "json_object"}`
- `extra_body={"reasoning_effort": LLM_REASONING_EFFORT}`
- `max_retries=0` on the OpenAI client

The application expects JSON responses and uses defensive parsing if the model wraps JSON in code fences or surrounding text.

### 8.3 Safe JSON Parsing

Function: `safe_parse_json(raw_text)`

Parsing strategy:

1. Try the raw response text.
2. If fenced JSON exists, try the fenced content.
3. If the text contains a JSON-looking object between `{` and `}`, try that substring.

Only JSON objects are accepted. Arrays, strings, and malformed JSON return `None`.

### 8.4 Fallback Behavior

The LLM client returns fallback content with an `error` field when:

- No API key is configured: `llm_api_key_missing`
- The LLM request times out: `llm_timeout`
- The LLM request raises an exception: `llm_error:<ExceptionClass>`
- The LLM returns malformed JSON: `llm_malformed_json`

This design prevents LLM failures from crashing the `/score` endpoint.

## 9. Feedback Generation

File: `feedback.py`

Feedback is generated only when the final rank tier is `LOW`.

Function: `generate_feedback_report(request, scores, final_score)`

The feedback prompt asks the LLM to return:

- `summary`
- `weak_pillars`
- `suggestions`
- `next_post_tips`

Weak pillars are calculated locally before the LLM call:

```text
content_quality is weak if score < 0.45
relevance is weak if score < 0.45
fairness is weak if score < 0.45
```

If no pillar is below `0.45`, all three pillars are listed as weak by default. This is a defensive fallback for unusual low-score combinations.

If feedback LLM generation fails, the service still returns a generated feedback report using local fallback suggestions and includes the fallback error marker.

For non-low posts, `empty_feedback_report()` returns:

```json
{
  "generated": false,
  "report": null,
  "error": null
}
```

## 10. Validation and Error Handling

FastAPI and Pydantic handle request validation automatically.

Common validation failures include:

- Empty `post_id`, `creator_id`, or `content_text`
- Negative exposure or engagement values
- Invalid `content_type`
- Invalid `image_url` or `video_url`
- Invalid datetime format for `created_at`

For invalid requests, FastAPI returns a standard `422 Unprocessable Entity` response with validation details.

LLM failures do not produce HTTP errors. They are converted into fallback scores with an `error` value inside the relevant score block.

## 11. Logging

`main.py` configures application logging with:

```text
%(asctime)s %(levelname)s %(name)s %(message)s
```

Every `/score` request logs:

- Post ID
- Client host
- Content quality score
- Relevance score
- Fairness score
- Final score
- Rank tier
- Latency in milliseconds

Example log shape:

```text
score_request post_id=post-123 client=127.0.0.1 quality=0.820 relevance=0.880 fairness=0.647 final_score=0.799 rank_tier=HIGH latency_ms=1250.44
```

LLM timeout, missing key, malformed JSON, and request exceptions are also logged by `llm_client.py`.

## 12. Local Development

### 12.1 Create Environment

From the `scoring-engine` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 12.2 Configure Environment

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Set the API key and desired model:

```text
NVIDIA_API_KEY=your_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL_NAME=openai/gpt-oss-20b
LLM_TIMEOUT_SECONDS=10
LLM_MAX_TOKENS=256
LLM_REASONING_EFFORT=low
```

The app can run without an API key, but LLM-backed modules will use fallback scores.

### 12.3 Run the Server

```powershell
uvicorn main:app --reload --port 8080
```

Useful URLs:

- `http://localhost:8080/`
- `http://localhost:8080/health`
- `http://localhost:8080/docs`

## 13. Demo Checks

The repository includes a demo validation script at `tests/demo_queries.py`.

Start the server first, then run:

```powershell
.\.venv\Scripts\python.exe tests\demo_queries.py --base-url http://127.0.0.1:8080
```

The script checks:

- `GET /health`
- `GET /`
- `POST /score` with an AI/fairness post
- `POST /score` with a weaker post

It validates:

- Required response fields
- Score ranges
- Rank tier values
- Boost recommendation type
- Feedback behavior for low-ranking posts

## 14. Container Deployment

File: `Dockerfile`

The Docker image:

1. Starts from `python:3.11-slim`
2. Sets Python runtime environment flags
3. Uses `/app` as the working directory
4. Installs dependencies from `requirements.txt`
5. Copies the application source
6. Exposes port `8080`
7. Runs Uvicorn on `0.0.0.0:8080`

Build locally:

```powershell
docker build -t scoring-engine .
```

Run locally:

```powershell
docker run --rm -p 8080:8080 --env-file .env scoring-engine
```

## 15. Google Cloud Run Deployment

The service is Cloud Run-ready because it listens on `0.0.0.0:8080` inside the container.

Example deployment:

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/scoring-engine
gcloud run deploy scoring-engine \
  --image gcr.io/YOUR_PROJECT/scoring-engine \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NVIDIA_API_KEY=YOUR_NVIDIA_API_KEY,NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1,NVIDIA_MODEL_NAME=openai/gpt-oss-20b
```

After deployment, clients can call:

```text
POST https://YOUR_CLOUD_RUN_URL/score
```

For production, configure secrets through the cloud provider's secret manager rather than committing `.env` values.

## 16. Dependency Summary

File: `requirements.txt`

Dependencies:

- `fastapi`: API framework
- `uvicorn[standard]`: ASGI server
- `pydantic`: request and response validation
- `python-dotenv`: local `.env` loading
- `openai`: OpenAI-compatible LLM client

## 17. Operational Notes

### Stateless Design

The service does not store post scores, creator state, feedback reports, or request history. Any persistence must be handled by the caller or by adding a storage layer.

### Latency

The slowest operations are the LLM calls for content quality, relevance, and low-score feedback. Quality and relevance run in parallel. Feedback runs after final scoring only for `LOW` posts.

### Reliability

The API is designed to return a score even when LLM calls fail. Fallback scores make the service resilient but can reduce scoring precision. Consumers should inspect score-level `error` fields when debugging or monitoring quality.

### Security

Current CORS settings allow all origins. This should be tightened for production. API keys should be provided through environment variables or secret management, never through source control.

### Observability

Request logs include enough information for latency and score distribution monitoring. For production, consider adding structured JSON logs, request IDs, metrics, and external tracing.

## 18. Extension Guide

### Add a New Scoring Pillar

To add a new scoring pillar:

1. Add new Pydantic response models in `models.py`.
2. Implement a scoring function in `scorer.py`.
3. Add the task to `run_scoring_modules()`.
4. Update `Scores` and `ScoreResponse`.
5. Adjust `compute_final_score()` and `WeightsUsed`.
6. Update tests and documentation.

### Change Scoring Weights

Update both:

- `compute_final_score()` in `scorer.py`
- `WeightsUsed` defaults in `models.py`

Keeping these in sync is important because API clients rely on `weights_used` to explain the score.

### Change Rank Thresholds

Update `determine_rank_tier()` in `scorer.py`.

If rank thresholds change, update:

- README scoring section
- This documentation
- Any frontend logic that displays rank tiers
- Tests or demo checks that assume current tier behavior

### Improve Feedback

Feedback behavior is isolated in `feedback.py`. The safest way to improve it is to adjust:

- `FEEDBACK_PROMPT`
- The fallback suggestions
- `_weak_pillars()` thresholds

### Restrict Frontend Access

Update the CORS middleware in `main.py`:

```python
allow_origins=["https://your-frontend-domain.com"]
```

## 19. Known Implementation Details and Caveats

- `image_url` and `video_url` are validated but not currently analyzed by the scoring logic.
- `content_type` is validated but does not currently change scoring behavior.
- `total_posts_in_system` is accepted but not currently used in scoring.
- Fairness uses only current post exposure and average exposure.
- The default model differs between `llm_client.py` and `.env.example`; set `NVIDIA_MODEL_NAME` explicitly.
- Non-low posts do not receive feedback, even if one individual pillar is weak.
- LLM-backed scoring quality depends on the provided trend sample and prompt behavior.

## 20. Quick Reference

Run locally:

```powershell
uvicorn main:app --reload --port 8080
```

Health check:

```text
GET http://localhost:8080/health
```

Interactive docs:

```text
GET http://localhost:8080/docs
```

Score endpoint:

```text
POST http://localhost:8080/score
```

Final scoring formula:

```text
final_score = (0.35 * quality) + (0.40 * relevance) + (0.25 * fairness)
```

Rank tiers:

```text
HIGH   >= 0.70
MEDIUM >= 0.45 and < 0.70
LOW    < 0.45
```
