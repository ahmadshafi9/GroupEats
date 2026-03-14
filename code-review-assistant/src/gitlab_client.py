"""
GitLab API client for the code review assistant.
Fetches MR changes, MR versions, and posts discussions (comments).
"""
import os
from typing import Any

import requests


def _base_url() -> str:
    return os.environ.get("GITLAB_BASE_URL", "https://gitlab.com").rstrip("/")


def _headers() -> dict[str, str]:
    token = os.environ.get("GITLAB_TOKEN")
    if not token:
        raise ValueError("GITLAB_TOKEN environment variable is required")
    return {"PRIVATE-TOKEN": token}


def get_mr_changes(project_id: str, merge_request_iid: int) -> list[dict[str, Any]]:
    """
    Fetch changed files and diff for a merge request.
    Returns list of change objects with old_path, new_path, diff, etc.
    """
    url = f"{_base_url()}/api/v4/projects/{project_id}/merge_requests/{merge_request_iid}/changes"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data.get("changes", [])


def get_mr_versions(project_id: str, merge_request_iid: int) -> list[dict[str, Any]]:
    """
    Fetch merge request diff versions (for inline comment position).
    Returns list of version objects; use the latest for base_sha, head_sha, start_sha.
    """
    url = f"{_base_url()}/api/v4/projects/{project_id}/merge_requests/{merge_request_iid}/versions"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def create_mr_discussion(
    project_id: str,
    merge_request_iid: int,
    body: str,
    *,
    position: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Create a new discussion (comment) on a merge request.
    If position is provided, the comment appears on the diff at that location.
    """
    url = f"{_base_url()}/api/v4/projects/{project_id}/merge_requests/{merge_request_iid}/discussions"
    payload: dict[str, Any] = {"body": body}
    if position:
        payload["position"] = position
    resp = requests.post(url, headers=_headers(), json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()
