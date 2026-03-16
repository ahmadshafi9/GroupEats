"""
Minimal Phase 1 pipeline: fetch MR changes and post one test comment.
Run from code-review-assistant/ with: python -m src.pipeline
"""
import os
import sys

from .extractors.base import extract_units
from .gitlab_client import (
    create_mr_discussion,
    get_file_raw,
    get_mr_changes,
    get_mr_versions,
    list_repo_tree,
)
from .redundancy.detector import run_redundancy_analysis
from .redundancy.llm import OpenRouterClient, assess_candidate


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
        mr_units = []
        changed_paths = set()
        for change in changes:
            new_path = change.get("new_path") or ""
            changed_paths.add(new_path)
            if change.get("deleted_file"):
                continue
            lower = new_path.lower()
            if not lower.endswith((".js", ".ts", ".jsx", ".tsx")):
                continue
            content = get_file_raw(project_id, new_path, ref)
            if not content:
                continue
            units = extract_units(new_path, content)
            mr_units.extend(units)

        # Build a baseline corpus from the target branch base (start_sha).
        versions = get_mr_versions(project_id, mr_iid_int)
        start_sha = None
        if versions:
            latest = versions[-1]
            start_sha = latest.get("start_commit_sha") or latest.get("base_commit_sha")
        baseline_ref = start_sha or ref

        existing_units = []
        for prefix in ("app", "components", "services", "hooks", "utils"):
            try:
                entries = list_repo_tree(project_id, baseline_ref, path=prefix, recursive=True)
            except Exception:
                continue
            for entry in entries:
                if entry.get("type") != "blob":
                    continue
                path = entry.get("path") or ""
                if path in changed_paths:
                    continue
                lower = path.lower()
                if not lower.endswith((".js", ".ts", ".jsx", ".tsx")):
                    continue
                content = get_file_raw(project_id, path, baseline_ref)
                if not content:
                    continue
                existing_units.extend(extract_units(path, content))
                if len(existing_units) >= 500:
                    break
            if len(existing_units) >= 500:
                break

        client = OpenRouterClient()

        def _assess(cand):
            return assess_candidate(cand, client=client)

        findings = []
        try:
            findings = run_redundancy_analysis(mr_units, existing_units, assess_fn=_assess)
        except Exception as e:
            # We'll still post counts below even if redundancy step fails.
            print(f"Redundancy step failed: {e}", file=sys.stderr)

        redundancy_hits = [f for f in findings if f.llm_decision in ("duplicate", "similar-intent")]

        lines = [
            "**Analyzer ran.**",
            "",
            "Phase 3: Redundant logic and similarity check results.",
            "",
            f"- Functions in MR: {len(mr_units)}",
            f"- Existing functions analyzed: {len(existing_units)}",
            f"- Potential redundancies: {len(redundancy_hits)}",
        ]

        for f in redundancy_hits[:10]:
            mr_name = f.mr_unit.name or "<anonymous>"
            ex_name = f.existing_unit.name or "<anonymous>"
            lines.append(
                f"- `{mr_name}` in `{f.mr_unit.file}:{f.mr_unit.start_line}` is **{f.llm_decision}** of "
                f"`{ex_name}` in `{f.existing_unit.file}:{f.existing_unit.start_line}` "
                f"(similarity {f.similarity:.2f}). {f.explanation}"
            )

        body = "\n".join(lines)
        create_mr_discussion(project_id, mr_iid_int, body)
        print(
            f"Posted test comment. MR has {len(changes)} change(s) "
            f"and {len(mr_units)} extracted function(s)."
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
