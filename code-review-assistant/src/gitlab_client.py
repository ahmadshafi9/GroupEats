"""
GitLab API client for the code review assistant.
Fetches MR changes, MR versions, file contents, and posts discussions (comments).
"""
import os
from typing import Any
from urllib.parse import quote

import requests


def _base_url() -> str:
    return os.environ.get("GITLAB_BASE_URL", "https://gitlab.com").rstrip("/")


def _headers() -> dict[str, str]:
    token = os.environ.get("GITLAB_TOKEN")
    if not token:
        raise ValueError(
            "GITLAB_TOKEN is not set. Add it in the project: "
            "Settings → CI/CD → Variables (masked, scope: api or All)."
        )
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


def get_file_raw(project_id: str, file_path: str, ref: str) -> str:
    """
    Fetch raw file contents for a given path at a specific ref (commit or branch).

    Returns the file content as text. If the file does not exist at the ref
    (for example, deleted in this MR), returns an empty string.
    """
    # file_path must be URL-encoded for the API
    encoded_path = quote(file_path, safe="")
    url = f"{_base_url()}/api/v4/projects/{project_id}/repository/files/{encoded_path}/raw"
    params = {"ref": ref}
    resp = requests.get(url, headers=_headers(), params=params, timeout=30)
    if resp.status_code == 404:
        return ""
    resp.raise_for_status()
    return resp.text


def list_repo_tree(project_id: str, ref: str, path: str = "", recursive: bool = True) -> list[dict[str, Any]]:
    """
    List repository tree entries (files and directories).
    Returns JSON entries with fields like: path, type ('blob' or 'tree').
    """
    url = f"{_base_url()}/api/v4/projects/{project_id}/repository/tree"
    params: dict[str, Any] = {"ref": ref, "recursive": recursive, "per_page": 100}
    if path:
        params["path"] = path
    resp = requests.get(url, headers=_headers(), params=params, timeout=30)
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
