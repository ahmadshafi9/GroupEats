from unittest.mock import patch

import pytest

from src.extractors.base import CodeUnit
from src.redundancy.embeddings import embed_code_units, embed_texts


def test_embed_texts_returns_vectors():
    fake = {
        "data": [
            {"embedding": [1.0, 0.0, 0.0]},
            {"embedding": [0.0, 1.0, 0.0]},
        ]
    }
    with patch("src.redundancy.embeddings.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = fake
        mock_post.return_value.text = ""

        with patch.dict("os.environ", {"VOYAGE_API_KEY": "test-key"}, clear=False):
            vectors = embed_texts(["a", "b"])

    assert vectors == [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]


def test_embed_texts_raises_on_error():
    with patch("src.redundancy.embeddings.requests.post") as mock_post:
        mock_post.return_value.status_code = 401
        mock_post.return_value.text = "unauthorized"
        with pytest.raises(RuntimeError, match="Voyage API error 401"):
            with patch.dict("os.environ", {"VOYAGE_API_KEY": "test-key"}, clear=False):
                embed_texts(["a"])


def test_embed_code_units_builds_payload_texts():
    fake = {"data": [{"embedding": [0.1, 0.2]}]}
    unit = CodeUnit(file="app/x.tsx", name="foo", start_line=1, end_line=2, source_text="function foo() {}")
    with patch("src.redundancy.embeddings.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = fake
        mock_post.return_value.text = ""

        with patch.dict("os.environ", {"VOYAGE_API_KEY": "test-key"}, clear=False):
            vectors = embed_code_units([unit])

    assert vectors == [[0.1, 0.2]]

