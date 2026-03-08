# CI/CD Setup

This project uses **GitHub Actions** to build, test, and deploy on every push and pull request.

## What runs

| Trigger        | Build & Test | Deploy to Vercel |
|----------------|--------------|------------------|
| Push to `main` | ✅           | ✅ (production)  |
| Pull request   | ✅           | ❌               |

**Build & Test job:**

- `npm ci` — install dependencies
- `npm run typecheck` — TypeScript check
- `npm run test` — tests (currently same as typecheck)
- `npm run build:web` — Expo web export

**Deploy job** (only on push to `main`):

- Runs after build-and-test passes
- Deploys to Vercel production via [amondnet/vercel-action](https://github.com/amondnet/vercel-action)

## Required GitHub secrets

Add these in **GitHub → repo → Settings → Secrets and variables → Actions**.

### For deploy to work

| Secret               | Where to get it |
|----------------------|------------------|
| `VERCEL_TOKEN`       | [Vercel Account → Tokens](https://vercel.com/account/tokens): create a token with full scope. |
| `VERCEL_ORG_ID`      | In your project folder run `vercel link`, then open `.vercel/project.json` and copy `orgId`. Or: Vercel dashboard → Project Settings → General. |
| `VERCEL_PROJECT_ID`  | Same `.vercel/project.json`, copy `projectId`. Or: Vercel dashboard → Project Settings → General. |

### Optional (for CI build to use real env)

If you want the **CI build** step to use your real Firebase/Maps config (e.g. for integration tests later), add the same `EXPO_PUBLIC_*` vars as repository secrets. Otherwise the workflow uses placeholders so the export still succeeds.

You should already have **Environment Variables** set in the **Vercel** project (Dashboard → Project → Settings → Environment Variables) so that Vercel’s build uses the real keys when deploying.

## Local commands

```bash
npm run typecheck   # TypeScript check
npm run test        # Same as typecheck (add Jest/etc. later)
npm run build:web   # Expo web export → dist/
```

## Adding real tests later

1. Add Jest (or another runner) and update the `test` script in `package.json`.
2. The workflow already runs `npm run test`; no change needed in the workflow.
