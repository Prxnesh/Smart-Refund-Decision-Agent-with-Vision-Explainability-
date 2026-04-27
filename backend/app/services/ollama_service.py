"""
Thin client for the local Ollama REST API.

Sync functions are used inside regular FastAPI route handlers (which FastAPI
runs in a thread pool).  The async generator is used exclusively by the
streaming /chat SSE endpoint.
"""
import json
import logging
import re
from typing import AsyncGenerator

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_GENERATE_URL = f"{settings.ollama_base_url}/api/generate"
_CHAT_URL = f"{settings.ollama_base_url}/api/chat"

_SYSTEM_PROMPT = (
    "You are a helpful and empathetic customer-service agent for an e-commerce platform. "
    "Help customers understand refund decisions and resolve their issues. "
    "Keep replies concise and professional."
)


# ---------------------------------------------------------------------------
# Sync helpers (used from sync route handlers)
# ---------------------------------------------------------------------------

def analyze_sentiment(text: str) -> dict:
    """
    Ask Ollama to score a complaint text and return structured scores.
    Falls back to keyword heuristics if Ollama is unavailable.
    """
    prompt = (
        "Analyze the following customer complaint and return ONLY a JSON object with these fields:\n"
        '  "sentiment_score": float 0-1  (1 = very negative/upset)\n'
        '  "anger_score":     float 0-1  (1 = very angry)\n'
        '  "genuineness_score": float 0-1 (1 = clearly genuine)\n\n'
        f"Complaint: {text}\n\n"
        "Respond with ONLY the JSON object, no explanation."
    )
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                _GENERATE_URL,
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False, "format": "json"},
            )
            resp.raise_for_status()
            raw = resp.json().get("response", "{}")
            data = json.loads(raw)
            return {
                "sentiment_score": round(float(data.get("sentiment_score", 0.5)), 3),
                "anger_score": round(float(data.get("anger_score", 0.3)), 3),
                "genuineness_score": round(float(data.get("genuineness_score", 0.5)), 3),
            }
    except Exception as exc:
        logger.warning("Ollama sentiment analysis failed, using keyword fallback: %s", exc)
        return _keyword_fallback(text)


def generate_explanation(decision: str, complaint_text: str, policy: dict) -> str:
    """
    Ask Ollama to write a natural-language explanation for the refund decision.
    Falls back to a rule-based string if Ollama is unavailable.
    """
    pct = int(policy.get("partial_refund_percent", 0.5) * 100)
    prompt = (
        f"A customer's refund request was decided as: {decision}.\n"
        f"Complaint summary: {complaint_text[:300]}\n"
        f"Policy: full refunds within {policy.get('refund_window_days', 30)} days, "
        f"partial ({pct}%) within {policy.get('partial_window_days', 60)} days.\n\n"
        "Write a single empathetic sentence explaining this decision to the customer. "
        "Do not repeat the decision word. No extra formatting."
    )
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                _GENERATE_URL,
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as exc:
        logger.warning("Ollama explanation generation failed, using rule-based fallback: %s", exc)
        return _rule_explanation(decision, policy)


# ---------------------------------------------------------------------------
# Async generator (used from the SSE /chat endpoint only)
# ---------------------------------------------------------------------------

async def stream_chat(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Yield token chunks from Ollama for the customer chatbot."""
    payload = {
        "model": settings.ollama_model,
        "messages": [{"role": "system", "content": _SYSTEM_PROMPT}] + messages,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
        async with client.stream("POST", _CHAT_URL, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                chunk = data.get("message", {}).get("content", "")
                if chunk:
                    yield chunk
                if data.get("done"):
                    break


# ---------------------------------------------------------------------------
# Fallback helpers (no Ollama dependency)
# ---------------------------------------------------------------------------

_NEGATIVE = {"broken", "angry", "furious", "bad", "terrible", "waste", "disappointed"}
_ANGER = {"angry", "furious", "outrage", "ridiculous", "unacceptable"}
_GENUINE = {"please", "help", "order", "invoice", "thanks", "kindly"}


def _keyword_fallback(text: str) -> dict:
    words = set(re.findall(r"[a-zA-Z']+", text.lower()))
    return {
        "sentiment_score": round(min(1.0, len(words & _NEGATIVE) / 4 + 0.2), 3),
        "anger_score": round(min(1.0, len(words & _ANGER) / 3 + 0.1), 3),
        "genuineness_score": round(min(1.0, len(words & _GENUINE) / 4 + 0.2), 3),
    }


def _rule_explanation(decision: str, policy: dict) -> str:
    if decision == "APPROVE":
        return "Your refund request appears genuine and falls within our policy window."
    if decision == "PARTIAL":
        pct = int(policy.get("partial_refund_percent", 0.5) * 100)
        return f"You are eligible for a partial refund of {pct}% under our extended policy."
    return "Unfortunately, this request does not meet our current refund policy criteria."
