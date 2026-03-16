"""
Tests for the GitLab API client. No real API calls; we mock requests.
"""
import os
from unittest.mock import patch

import pytest

# Import the module under test (run tests from code-review-assistant with PYTHONPATH=. or repo root)
from src.gitlab_client import create_mr_discussion, get_file_raw, get_mr_changes, get_mr_versions


@pytest.fixture(autouse=True)
def env():
    with patch.dict(
        os.environ,
        {"GITLAB_TOKEN": "test-token", "GITLAB_BASE_URL": "https://gitlab.com"},
        clear=False,
    ):
        yield


def test_get_mr_changes_returns_list_of_changes(env):
    mock_response = {
        "changes": [
            {
                "old_path": "app/foo.tsx",
                "new_path": "app/foo.tsx",
                "diff": "--- a/app/foo.tsx\n+++ b/app/foo.tsx",
                "new_file": False,
                "deleted_file": False,
            },
            {
                "old_path": "README.md",
                "new_path": "README.md",
                "diff": "--- a/README.md\n+++ b/README.md",
                "new_file": False,
                "deleted_file": False,
            },
        ]
    }
    with patch("src.gitlab_client.requests.get") as mock_get:
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.raise_for_status = lambda: None

        result = get_mr_changes("123", 5)

    assert len(result) == 2
    assert result[0]["new_path"] == "app/foo.tsx"
    assert result[1]["new_path"] == "README.md"
    mock_get.assert_called_once()
    call_args = mock_get.call_args
    assert "projects/123/merge_requests/5/changes" in call_args[0][0]


def test_get_mr_versions_returns_list(env):
    mock_versions = [
        {
            "id": 1,
            "head_commit_sha": "abc123",
            "base_commit_sha": "def456",
            "start_commit_sha": "def456",
        }
    ]
    with patch("src.gitlab_client.requests.get") as mock_get:
        mock_get.return_value.json.return_value = mock_versions
        mock_get.return_value.raise_for_status = lambda: None

        result = get_mr_versions("123", 5)

    assert len(result) == 1
    assert result[0]["head_commit_sha"] == "abc123"
    assert "versions" in mock_get.call_args[0][0]


def test_create_mr_discussion_builds_correct_payload(env):
    mock_response = {"id": "disc-1", "notes": [{"body": "Hello"}]}
    with patch("src.gitlab_client.requests.post") as mock_post:
        mock_post.return_value.json.return_value = mock_response
        mock_post.return_value.raise_for_status = lambda: None

        create_mr_discussion("123", 5, "Analyzer ran.")

    mock_post.assert_called_once()
    call_kwargs = mock_post.call_args[1]
    assert call_kwargs["json"]["body"] == "Analyzer ran."
    assert "position" not in call_kwargs["json"]


def test_create_mr_discussion_with_position(env):
    mock_response = {"id": "disc-2", "notes": []}
    position = {
        "base_sha": "base",
        "head_sha": "head",
        "start_sha": "start",
        "position_type": "text",
        "new_path": "app/foo.tsx",
        "old_path": "app/foo.tsx",
        "new_line": 10,
    }
    with patch("src.gitlab_client.requests.post") as mock_post:
        mock_post.return_value.json.return_value = mock_response
        mock_post.return_value.raise_for_status = lambda: None

        create_mr_discussion("123", 5, "Comment on line 10", position=position)

    call_kwargs = mock_post.call_args[1]
    assert call_kwargs["json"]["position"] == position
    assert call_kwargs["json"]["body"] == "Comment on line 10"


def test_missing_token_raises(env):
    with patch.dict(os.environ, {"GITLAB_TOKEN": ""}, clear=False):
        with pytest.raises(ValueError, match="GITLAB_TOKEN"):
            get_mr_changes("123", 5)


def test_get_file_raw_returns_text(env):
    class DummyResponse:
        def __init__(self, status_code: int, text: str) -> None:
            self.status_code = status_code
            self.text = text

        def raise_for_status(self) -> None:
            if self.status_code >= 400:
                raise RuntimeError("error")

    dummy = DummyResponse(200, "console.log('hi');")
    with patch("src.gitlab_client.requests.get", return_value=dummy) as mock_get:
        result = get_file_raw("123", "app/index.tsx", "abc")

    assert result == "console.log('hi');"
    called_url = mock_get.call_args[0][0]
    assert "/projects/123/repository/files/" in called_url
    assert called_url.endswith("/raw")


def test_get_file_raw_returns_empty_on_404(env):
    class DummyResponse:
        def __init__(self, status_code: int) -> None:
            self.status_code = status_code

        def raise_for_status(self) -> None:
            raise RuntimeError("should not be called")

        @property
        def text(self) -> str:  # pragma: no cover - not used in this case
            return "not used"

    dummy = DummyResponse(404)
    with patch("src.gitlab_client.requests.get", return_value=dummy):
        result = get_file_raw("123", "missing.ts", "abc")

    assert result == ""
