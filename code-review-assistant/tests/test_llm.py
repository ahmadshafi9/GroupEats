from unittest.mock import patch

import pytest

from src.redundancy.llm import OpenRouterClient, assess_candidate
from src.redundancy.types import RedundancyCandidate
from src.extractors.base import CodeUnit


def test_openrouter_client_parses_success_response():
    fake = {"choices": [{"message": {"content": "{\"decision\":\"duplicate\",\"explanation\":\"reuse\"}"}}]}
    with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}, clear=False):
        with patch("src.redundancy.llm.requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = fake
            mock_post.return_value.text = ""

            client = OpenRouterClient(model="openrouter/free")
            out = client.call("hi")

    assert "decision" in out


def test_assess_candidate_parses_json():
    mr = CodeUnit("mr.ts", "mr", 1, 2, "function mr() {}")
    ex = CodeUnit("ex.ts", "ex", 1, 2, "function ex() {}")
    cand = RedundancyCandidate(mr_unit=mr, existing_unit=ex, similarity=0.9)

    class FakeClient:
        def call(self, prompt: str) -> str:
            return "{\"decision\":\"duplicate\",\"explanation\":\"Consider reusing ex()\"}"

    finding = assess_candidate(cand, client=FakeClient())  # type: ignore[arg-type]
    assert finding.llm_decision == "duplicate"
    assert "reusing" in finding.explanation


def test_openrouter_raises_on_error():
    with patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key"}, clear=False):
        with patch("src.redundancy.llm.requests.post") as mock_post:
            mock_post.return_value.status_code = 429
            mock_post.return_value.text = "rate limit"
            with pytest.raises(RuntimeError, match="OpenRouter API error 429"):
                OpenRouterClient().call("hi")

