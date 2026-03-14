# GitLab AI Code Review Assistant

Phase 1: GitLab client + CI job that posts a test comment on every merge request.

**Docs (in repo root `docs/`):** [CODE_REVIEW_ASSISTANT_PLAN.md](../docs/CODE_REVIEW_ASSISTANT_PLAN.md) (full implementation plan), [PHASE1_SETUP.md](../docs/PHASE1_SETUP.md) (setup and verify).

## Run tests

From this directory:

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest tests/ -v
```

## Run pipeline locally (optional)

You need `GITLAB_TOKEN`, `CI_PROJECT_ID`, and `CI_MERGE_REQUEST_IID` set. Then:

```bash
python -m src.pipeline
```

Normally the pipeline runs in GitLab CI on every MR.
