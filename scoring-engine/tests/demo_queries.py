from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "http://35.244.13.244/"


def main() -> int:
    parser = argparse.ArgumentParser(description="Send demo requests to the EquiFeed scoring API.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Base URL for the running API.")
    parser.add_argument("--timeout", type=float, default=40.0, help="Request timeout in seconds.")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    checks = [
        ("health", lambda: check_health(base_url, args.timeout)),
        ("root", lambda: check_root(base_url, args.timeout)),
        ("score_text_post", lambda: check_score(base_url, "score_text_post", text_post_payload(), args.timeout)),
        ("score_low_exposure_post", lambda: check_score(base_url, "score_low_exposure_post", low_exposure_payload(), args.timeout)),
    ]

    failures = 0
    for name, check in checks:
        started = time.perf_counter()
        try:
            response = check()
            elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
            print(f"[PASS] {name} ({elapsed_ms} ms)")
            print(json.dumps(response, indent=2))
        except AssertionError as exc:
            failures += 1
            print(f"[FAIL] {name}: {exc}", file=sys.stderr)
        except Exception as exc:
            failures += 1
            print(f"[ERROR] {name}: {exc}", file=sys.stderr)

    if failures:
        print(f"\n{failures} check(s) failed.", file=sys.stderr)
        return 1

    print("\nAll demo API checks passed.")
    return 0


def check_health(base_url: str, timeout: float) -> dict[str, Any]:
    response = get_json(f"{base_url}/health", timeout)
    assert response["status"] == "ok", "health status must be ok"
    assert response["service"] == "equifeed-scoring-engine", "service name mismatch"
    return response


def check_root(base_url: str, timeout: float) -> dict[str, Any]:
    response = get_json(f"{base_url}/", timeout)
    assert response["status"] == "ok", "root status must be ok"
    assert response["service"] == "equifeed-scoring-engine", "service name mismatch"
    assert "score" in response["endpoints"], "root response must list score endpoint"
    return response


def check_score(base_url: str, case_name: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    response = post_json(f"{base_url}/score", payload, timeout)
    assert response["post_id"] == payload["post_id"], f"{case_name}: post_id mismatch"
    assert 0.0 <= response["final_score"] <= 1.0, f"{case_name}: final_score out of range"
    assert response["rank_tier"] in {"HIGH", "MEDIUM", "LOW"}, f"{case_name}: invalid rank tier"
    assert isinstance(response["boost_recommended"], bool), f"{case_name}: boost flag must be boolean"

    scores = response["scores"]
    assert_score_block(scores["content_quality"], "content_quality", case_name)
    assert_score_block(scores["relevance"], "relevance", case_name)
    assert_score_block(scores["fairness"], "fairness", case_name)

    feedback = response["feedback_report"]
    assert isinstance(feedback["generated"], bool), f"{case_name}: feedback.generated must be boolean"
    if response["rank_tier"] == "LOW":
        assert feedback["generated"] is True, f"{case_name}: LOW posts must include generated feedback"
        assert feedback["report"] is not None, f"{case_name}: LOW posts must include feedback report"
    else:
        assert feedback["generated"] is False, f"{case_name}: non-LOW posts should not generate feedback"

    return response


def assert_score_block(block: dict[str, Any], block_name: str, case_name: str) -> None:
    assert 0.0 <= block["score"] <= 1.0, f"{case_name}: {block_name}.score out of range"
    assert isinstance(block["reasoning"], str), f"{case_name}: {block_name}.reasoning must be text"


def text_post_payload() -> dict[str, Any]:
    return {
        "post_id": "demo-post-ai-fairness-001",
        "creator_id": "demo-creator-001",
        "content_text": (
            "AI ranking systems should reward useful posts without burying smaller creators. "
            "A fair feed needs both relevance and exposure balance."
        ),
        "content_type": "text",
        "image_url": None,
        "video_url": None,
        "topic_tags": ["AI", "fairness", "ranking"],
        "created_at": datetime.now(UTC).isoformat(),
        "total_posts_in_system": 500,
        "post_current_exposure": 120,
        "avg_exposure_all_posts": 340,
        "trending_posts_sample": [
            {"title": "AI agents for software teams", "tags": ["AI", "agents"], "engagement": 9400},
            {"title": "Fairness in social media ranking", "tags": ["fairness", "ranking"], "engagement": 7200},
        ],
    }


def low_exposure_payload() -> dict[str, Any]:
    return {
        "post_id": "demo-post-low-signal-002",
        "creator_id": "demo-creator-002",
        "content_text": "Random thought today.",
        "content_type": "text",
        "image_url": None,
        "video_url": None,
        "topic_tags": ["personal"],
        "created_at": datetime.now(UTC).isoformat(),
        "total_posts_in_system": 500,
        "post_current_exposure": 490,
        "avg_exposure_all_posts": 340,
        "trending_posts_sample": [
            {"title": "AI policy for creator platforms", "tags": ["AI", "policy"], "engagement": 9400},
            {"title": "New short-form video growth tactics", "tags": ["video", "growth"], "engagement": 7200},
        ],
    }


def get_json(url: str, timeout: float) -> dict[str, Any]:
    request = Request(url, method="GET")
    return send_json_request(request, timeout)


def post_json(url: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    return send_json_request(request, timeout)


def send_json_request(request: Request, timeout: float) -> dict[str, Any]:
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {error_body}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not connect to API: {exc.reason}") from exc

    parsed = json.loads(body)
    if not isinstance(parsed, dict):
        raise RuntimeError("API response was not a JSON object")
    return parsed


if __name__ == "__main__":
    raise SystemExit(main())
