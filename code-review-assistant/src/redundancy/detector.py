import math
import os
from typing import Callable, List

from src.extractors.base import CodeUnit
from src.redundancy.embeddings import embed_texts
from src.redundancy.types import FunctionEmbedding, RedundancyCandidate, RedundancyFinding


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def build_function_embeddings(
    units: List[CodeUnit],
    embed_fn: Callable[[List[str]], List[List[float]]] = embed_texts,
) -> List[FunctionEmbedding]:
    texts = []
    for u in units:
        name = u.name or "<anonymous>"
        texts.append(f"File: {u.file}\nName: {name}\nCode:\n{u.source_text}")
    vectors = embed_fn(texts) if texts else []
    return [FunctionEmbedding(unit=unit, vector=vec) for unit, vec in zip(units, vectors)]


def find_top_similar(
    mr_embeddings: List[FunctionEmbedding],
    existing_embeddings: List[FunctionEmbedding],
    top_k: int,
    min_similarity: float,
) -> List[RedundancyCandidate]:
    candidates: List[RedundancyCandidate] = []
    for mr in mr_embeddings:
        scored: List[RedundancyCandidate] = []
        for ex in existing_embeddings:
            sim = cosine_similarity(mr.vector, ex.vector)
            if sim >= min_similarity:
                scored.append(
                    RedundancyCandidate(mr_unit=mr.unit, existing_unit=ex.unit, similarity=sim)
                )
        scored.sort(key=lambda c: c.similarity, reverse=True)
        candidates.extend(scored[:top_k])
    return candidates


def _min_similarity() -> float:
    try:
        return float(os.environ.get("REDUNDANCY_MIN_SIMILARITY", "0.85"))
    except ValueError:
        return 0.85


def _max_llm_calls() -> int:
    try:
        return int(os.environ.get("REDUNDANCY_MAX_LLM_CALLS", "10"))
    except ValueError:
        return 10


def run_redundancy_analysis(
    mr_units: List[CodeUnit],
    existing_units: List[CodeUnit],
    assess_fn: Callable[[RedundancyCandidate], RedundancyFinding],
) -> List[RedundancyFinding]:
    mr_emb = build_function_embeddings(mr_units)
    ex_emb = build_function_embeddings(existing_units)
    candidates = find_top_similar(mr_emb, ex_emb, top_k=2, min_similarity=_min_similarity())
    findings: List[RedundancyFinding] = []
    for cand in candidates[: _max_llm_calls()]:
        findings.append(assess_fn(cand))
    return findings

