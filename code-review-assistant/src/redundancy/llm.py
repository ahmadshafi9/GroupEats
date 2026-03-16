import json
import os
from dataclasses import dataclass
from typing import Any, Dict

import requests

from src.redundancy.types import RedundancyCandidate, RedundancyFinding


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def _openrouter_api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ValueError("OPENROUTER_API_KEY is required for redundancy analysis.")
    return key


def _openrouter_model() -> str:
    return os.environ.get("OPENROUTER_MODEL", "openrouter/free")


@dataclass
class OpenRouterClient:
    model: str | None = None

    def call(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {_openrouter_api_key()}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model or _openrouter_model(),
            "messages": [
                {"role": "system", "content": "You are a helpful senior code reviewer."},
                {"role": "user", "content": prompt},
            ],
        }
        resp = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter API error {resp.status_code}: {resp.text}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def assess_candidate(candidate: RedundancyCandidate, client: OpenRouterClient) -> RedundancyFinding:
    mr = candidate.mr_unit
    ex = candidate.existing_unit
    prompt = (
        "You are reviewing a GitLab merge request for JavaScript/TypeScript code.\n\n"
        "New function (in MR):\n"
        f"File: {mr.file}\nName: {mr.name}\nCode:\n{mr.source_text}\n\n"
        "Existing function (already in repo):\n"
        f"File: {ex.file}\nName: {ex.name}\nCode:\n{ex.source_text}\n\n"
        f"Similarity score from embeddings: {candidate.similarity:.4f}\n\n"
        "Q1: Are these functions semantically duplicates or mostly implementing the same logic?\n"
        "Answer one of: duplicate, similar-intent, different.\n"
        "Q2: In one short sentence, suggest what the developer should do.\n"
        'Respond in JSON: {"decision": "...", "explanation": "..."}\n'
    )
    raw = client.call(prompt)
    decision = "inconclusive"
    explanation = raw.strip()
    try:
        parsed: Dict[str, Any] = json.loads(raw)
        decision = str(parsed.get("decision", decision))
        explanation = str(parsed.get("explanation", explanation))
    except Exception:
        pass
    return RedundancyFinding(
        mr_unit=mr,
        existing_unit=ex,
        similarity=candidate.similarity,
        llm_decision=decision,
        explanation=explanation,
    )

