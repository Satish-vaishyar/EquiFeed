from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL_NAME = os.getenv("NVIDIA_MODEL_NAME", "openai/gpt-oss-120b")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "10"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "256"))
LLM_REASONING_EFFORT = os.getenv("LLM_REASONING_EFFORT", "low")


class LLMClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.base_url = NVIDIA_BASE_URL
        self.model_name = NVIDIA_MODEL_NAME
        self._client: OpenAI | None = None

        if self.api_key:
            self._client = OpenAI(base_url=self.base_url, api_key=self.api_key, max_retries=0)
        else:
            logger.warning("NVIDIA_API_KEY is not configured. LLM calls will use fallbacks.")

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback: dict[str, Any],
        timeout_seconds: float = LLM_TIMEOUT_SECONDS,
        max_tokens: int = LLM_MAX_TOKENS,
    ) -> dict[str, Any]:
        if self._client is None:
            return self._with_error(fallback, "llm_api_key_missing")

        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self._client.chat.completions.create,
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0,
                    max_tokens=max_tokens,
                    stream=False,
                    response_format={"type": "json_object"},
                    extra_body={"reasoning_effort": LLM_REASONING_EFFORT},
                    timeout=timeout_seconds,
                ),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            logger.warning("LLM request timed out after %.1f seconds.", timeout_seconds)
            return self._with_error(fallback, "llm_timeout")
        except Exception as exc:
            logger.exception("LLM request failed.")
            return self._with_error(fallback, f"llm_error:{exc.__class__.__name__}")

        text = _extract_completion_text(response)
        parsed = safe_parse_json(text)
        if parsed is None:
            logger.warning("LLM returned malformed JSON: %s", text[:500])
            return self._with_error(fallback, "llm_malformed_json")

        return parsed

    @staticmethod
    def _with_error(fallback: dict[str, Any], error: str) -> dict[str, Any]:
        result = dict(fallback)
        result["error"] = error
        return result


def _extract_completion_text(response: Any) -> str:
    choices = getattr(response, "choices", None) or []
    if not choices:
        return ""

    message = getattr(choices[0], "message", None)
    if message is None:
        return ""

    content = getattr(message, "content", "") or ""
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(str(item.get("text") or item.get("content") or ""))
            else:
                parts.append(str(item))
        return "".join(parts)

    return str(content)


def safe_parse_json(raw_text: str) -> dict[str, Any] | None:
    text = raw_text.strip()
    if not text:
        return None

    candidates = [text]

    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        candidates.append(fenced.group(1).strip())

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(text[start : end + 1])

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed

    return None


llm_client = LLMClient()
