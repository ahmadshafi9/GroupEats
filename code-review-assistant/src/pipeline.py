"""
Minimal Phase 1 pipeline: fetch MR changes and post one test comment.
Run from code-review-assistant/ with: python -m src.pipeline
"""
import os
import sys

from .gitlab_client import create_mr_discussion, get_mr_changes, get_mr_versions


def main() -> None:
    project_id = os.environ.get("CI_PROJECT_ID")
    mr_iid = os.environ.get("CI_MERGE_REQUEST_IID")
    if not project_id or not mr_iid:
        print("CI_PROJECT_ID and CI_MERGE_REQUEST_IID are required (run in GitLab CI on an MR pipeline)")
        sys.exit(1)

    try:
        changes = get_mr_changes(project_id, int(mr_iid))
        _ = get_mr_versions(project_id, int(mr_iid))
        create_mr_discussion(
            project_id,
            int(mr_iid),
            "**Analyzer ran.**\n\nPhase 1: GitLab client is working. "
            f"Found **{len(changes)}** changed file(s) in this MR.",
        )
        print(f"Posted test comment. MR has {len(changes)} change(s).")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
