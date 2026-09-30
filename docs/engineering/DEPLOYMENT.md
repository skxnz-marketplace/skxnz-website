# Deployment

Facts only. Where something is not proven, it says so.

## Target

- Vercel project `skxnz-website`, serving https://skxnz.com (region bom1).
- The skxnz Vercel account is **separate** from the shivayonic one. The ARGUS workbench's Vercel
  connection is read-only (it lists deployments; it cannot deploy).
- GitHub repo: `skxnz-marketplace/skxnz-website` (public). Its default branch is `main`.

## Production branch: UNKNOWN

Nobody has confirmed which Git branch Vercel treats as Production. The evidence is inconsistent,
so **do not assume `main`**, and do not push to test it.

Production history, from GitHub's deployments API (all created by `vercel[bot]`) and the
deploy notes in PROGRESS.md. Each one is a local Git tag `deployed/<date>-<source>-<sha>`:

| When (UTC) | Commit | Came from |
|---|---|---|
| 2026-08-08 20:47 | `af6231f` | `main` tip |
| 2026-08-08 21:22 | `293e7cc` | `launch-war-july30` line |
| 2026-08-17 07:20 | `81d863d` | `launch-war-july30` tip |
| 2026-09-24 10:05 | `57e3142` | Vercel bot branch `vercel/vercel-web-analytics-integrati-zdcrpw`; Preview 13 min earlier on the same commit, so most likely a manual promote |
| 2026-09-27 | `06d78d5` | `dpl_3jcbgTobUaMQTmTfzmX5SeZHnkHB`, Vercel CLI deploy from a local working tree (not pushed) |

`main` has not been deployed since 2026-08-08. Production after that came from other branches,
a promoted preview, and a CLI deploy.

`git tag -l "deployed/*"` shows these. `deployed/2026-09-27-ga4-06d78d5` is the last known production state.

## Current state (2026-10-01)

- Live: `06d78d5` (Vercel Analytics + consent-gated GA4 `G-DB3L1WH491`).
- Canonical next version: `integrate/recover-missing-work`, which already contains `06d78d5`
  (merged in `2f96774`). See `git log deployed/2026-09-27-ga4-06d78d5..integrate/recover-missing-work`.
- Nothing from the canonical branch has been pushed or deployed.

## How to find out the production branch

Vercel dashboard → project `skxnz-website` → Settings → Git → **Production Branch**.
Record the answer here and in the table above. Until then, every production deploy needs an
explicit decision from the founder.

## Deploy procedure (once the production branch is known)

1. All checks green on the canonical branch (see README).
2. Push the canonical branch to the production branch (founder approval required).
3. Watch the Vercel deployment; smoke-test `/`, `/shop`, a PDP, `/cart`, `/login`, `/ai`,
   `/sitemap.xml`, `/robots.txt`, `/llms.txt`.
4. Tag it locally: `git tag -a deployed/<date>-<branch>-<sha> <sha> -m "<dpl id / notes>"`.

Avoid CLI deploys from unpushed working trees. That is how production drifted away from every branch.

## Things that do not exist yet

No CI pipeline beyond Vercel's own build, no staging environment, no automated smoke test after deploy.
