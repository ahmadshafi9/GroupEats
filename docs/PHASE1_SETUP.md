# Phase 1 – What to do after

## 1. Get this into your GroupEats repo

Your GroupEats repo is at **https://gitlab.com/ahmadshafi9/GroupEats**. Do one of the following:

**Option A – You have GroupEats cloned somewhere**

- Copy into your GroupEats repo root:
  - the whole **`code-review-assistant/`** folder
  - the **`.gitlab-ci.yml`** file (at repo root)
  - the **`docs/`** folder (or merge: add `architecture-plan.yaml` and `team-plan.yaml` into your existing `docs/`)
- Commit and push to a branch, then open an MR to `main`.

**Option B – You want to use this workspace as the repo**

- Clone GroupEats into this folder, then add the Phase 1 files into the clone:
  ```bash
  cd "/Users/ahmadshafi/GitLab Hackathon"
  git clone https://gitlab.com/ahmadshafi9/GroupEats.git temp-group-eats
  cp -r code-review-assistant temp-group-eats/
  cp .gitlab-ci.yml temp-group-eats/
  mkdir -p temp-group-eats/docs
  cp docs/architecture-plan.yaml docs/team-plan.yaml temp-group-eats/docs/
  # Then use temp-group-eats as your repo and delete the loose files
  ```

---

## 2. Set GitLab CI variable

1. Open **https://gitlab.com/ahmadshafi9/GroupEats**.
2. Go to **Settings → CI/CD**.
3. Expand **Variables**.
4. Add a variable:
   - **Key:** `GITLAB_TOKEN`
   - **Value:** your GitLab token (the one you created with **api** + **write_repository** scopes)
   - **Type:** Variable
   - **Flags:** check **Mask variable** (recommended).
5. Save.

No other APIs (Voyage, OpenRouter) are needed for Phase 1.

---

## 3. Verify

1. In GroupEats, create a branch, change a file (e.g. add a comment in `app/index.tsx`), commit, push.
2. Open a **Merge Request** to `main`.
3. The pipeline should run (single job: **analyzer**).
4. When it finishes, you should see a comment on the MR: **"Analyzer ran. Phase 1: GitLab client is working. Found N changed file(s) in this MR."**

If the job fails, check the job log. Common issues:

- **401 / 403:** `GITLAB_TOKEN` missing or wrong, or token without **api** scope.
- **CI_PROJECT_ID / CI_MERGE_REQUEST_IID missing:** Pipeline must run on an MR (not on push to a branch without an open MR).

---

## 4. Optional: run tests in CI

To run pytest in CI, add to `.gitlab-ci.yml` in the `analyzer` job:

```yaml
script:
  - python -m pytest tests/ -v
  - python -m src.pipeline
```

Or add a separate `test` job that runs on the same MR and only runs pytest (no token needed for tests).
