"""
Minimal Phase 1 pipeline: fetch MR changes and post one test comment.
Run from code-review-assistant/ with: python -m src.pipeline
"""
import os
import sys

from .gitlab_client import create_mr_discussion, get_file_raw, get_mr_changes, get_mr_versions
from .extractors.base import extract_units


def main() -> None:
    project_id = os.environ.get("CI_PROJECT_ID")
    mr_iid = os.environ.get("CI_MERGE_REQUEST_IID")
    if not project_id or not mr_iid:
        print("CI_PROJECT_ID and CI_MERGE_REQUEST_IID are required (run in GitLab CI on an MR pipeline)")
        sys.exit(1)

    try:
        mr_iid_int = int(mr_iid)
        changes = get_mr_changes(project_id, mr_iid_int)
        _ = get_mr_versions(project_id, mr_iid_int)

        ref = os.environ.get("CI_COMMIT_SHA", "HEAD")
        all_units = []
        for change in changes:
            new_path = change.get("new_path") or ""
            if change.get("deleted_file"):
                continue
            lower = new_path.lower()
            if not lower.endswith((".js", ".ts", ".jsx", ".tsx")):
                continue
            content = get_file_raw(project_id, new_path, ref)
            if not content:
                continue
            units = extract_units(new_path, content)
            all_units.extend(units)

        body = (
            "**Analyzer ran.**\n\n"
            "Phase 2: JS/TS extractor is working. "
            f"Found **{len(changes)}** changed file(s) in this MR and "
            f"**{len(all_units)}** function(s) in changed JS/TS files."
        )
        create_mr_discussion(project_id, mr_iid_int, body)
        print(
            f"Posted test comment. MR has {len(changes)} change(s) "
            f"and {len(all_units)} extracted function(s)."
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
