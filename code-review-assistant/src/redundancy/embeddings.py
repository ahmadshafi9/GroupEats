import os
from typing import List

import requests

from src.extractors.base import CodeUnit


VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"


def _voyage_api_key() -> str:
    key = os.environ.get("VOYAGE_API_KEY")
    if not key:
        raise ValueError("VOYAGE_API_KEY is required for redundancy analysis.")
    return key


def _voyage_model() -> str:
    return os.environ.get("VOYAGE_MODEL", "voyage-4-lite")


def _build_payload_text(unit: CodeUnit) -> str:
    name = unit.name or "<anonymous>"
    return f"File: {unit.file}\nName: {name}\nCode:\n{unit.source_text}"


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Call Voyage embeddings API for a list of texts.
    """
    headers = {
        "Authorization": f"Bearer {_voyage_api_key()}",
        "Content-Type": "application/json",
    }
    model = _voyage_model()
    payload = {"model": model, "input": texts}
    resp = requests.post(VOYAGE_API_URL, json=payload, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Voyage API error {resp.status_code}: {resp.text}")
    data = resp.json()
    return [item["embedding"] for item in data.get("data", [])]


def embed_code_units(units: List[CodeUnit]) -> List[List[float]]:
    texts = [_build_payload_text(u) for u in units]
    return embed_texts(texts)

