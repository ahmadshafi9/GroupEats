from src.extractors.base import CodeUnit
from src.redundancy.detector import cosine_similarity, find_top_similar, run_redundancy_analysis
from src.redundancy.types import FunctionEmbedding, RedundancyCandidate, RedundancyFinding


def test_cosine_similarity_basic():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_find_top_similar_filters_by_threshold_and_topk():
    mr_unit = CodeUnit("a.ts", "a", 1, 1, "a")
    ex1 = CodeUnit("b.ts", "b", 1, 1, "b")
    ex2 = CodeUnit("c.ts", "c", 1, 1, "c")
    mr = [FunctionEmbedding(mr_unit, [1.0, 0.0])]
    ex = [FunctionEmbedding(ex1, [1.0, 0.0]), FunctionEmbedding(ex2, [0.9, 0.1])]

    cands = find_top_similar(mr, ex, top_k=1, min_similarity=0.95)

    assert len(cands) == 1
    assert cands[0].existing_unit.file == "b.ts"
    assert cands[0].similarity >= 0.95


def test_run_redundancy_analysis_uses_assess_fn(monkeypatch):
    mr_unit = CodeUnit("mr.ts", "mr", 1, 1, "a")
    ex_unit = CodeUnit("ex.ts", "ex", 1, 1, "a")

    def fake_build_embeddings(units, embed_fn=None):
        return [FunctionEmbedding(unit=u, vector=[1.0, 0.0]) for u in units]

    import src.redundancy.detector as det
    monkeypatch.setattr(det, "build_function_embeddings", fake_build_embeddings)

    def assess(cand: RedundancyCandidate) -> RedundancyFinding:
        return RedundancyFinding(
            mr_unit=cand.mr_unit,
            existing_unit=cand.existing_unit,
            similarity=cand.similarity,
            llm_decision="duplicate",
            explanation="reuse it",
        )

    findings = run_redundancy_analysis([mr_unit], [ex_unit], assess_fn=assess)
    assert len(findings) >= 1
    assert findings[0].llm_decision == "duplicate"

