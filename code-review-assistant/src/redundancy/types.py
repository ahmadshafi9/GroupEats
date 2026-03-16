from dataclasses import dataclass
from typing import List

from src.extractors.base import CodeUnit


@dataclass
class FunctionEmbedding:
    unit: CodeUnit
    vector: List[float]


@dataclass
class RedundancyCandidate:
    mr_unit: CodeUnit
    existing_unit: CodeUnit
    similarity: float


@dataclass
class RedundancyFinding:
    mr_unit: CodeUnit
    existing_unit: CodeUnit
    similarity: float
    llm_decision: str
    explanation: str

