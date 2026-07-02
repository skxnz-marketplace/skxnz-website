---
title: Slice 2 Diff Review — Auth Callback Open-Redirect Fix
date: 2026-07-02
tags:
  - report
  - review
  - diff
  - security
  - auth
  - pre-commit
type: diff-review
agent: skxnz-master-planner
status: complete
app_source_touched: false
commit: false
push: false
pr: false
---

# Slice 2 Diff Review — Auth Callback Open-Redirect Fix

> [!abstract] Purpose
> Pre-commit review of the working-tree diff for the auth-callback open-redirect fix (M6). Read-only; only this report written. **Do not commit yet.**

**Date:** 2026-07-02

## Files reviewed
- `app/auth/callback/route.ts` (source diff)
- [[SLICE_2_AUTH_CALLBACK_REDIRECT_FIX_REPORT]] (executor report)

## Source diff summary
- Added pure helper `safeNextPath(raw: string | null): string` (7 lines + comment).
- Changed one line: `next` now `safeNextPath(searchParams.get("next"))` instead of `searchParams.get("next") ?? "/"`.
- **No imports added** (helper is module-local, uses only string methods). No change to `exchangeCodeForSession`, `origin`, response construction, or the `/login?error=` paths. Route `GET` signature unchanged.

## Redirect risk before
`next` was read raw and interpolated as `` `${origin}${next}` `` after successful session exchange. Protocol-relative (`//evil.com`) and backslash (`/\evil.com`) values are treated by browsers as external hosts → authenticated user redirected off-origin. Open redirect (phishing / auth-context handoff). `javascript:` / `data:` / `https://…` also passed through.

## Redirect protection after
`safeNextPath()` enforces:
1. `!raw` → `/` (missing).
2. `!startsWith("/")` → `/` (blocks `https://`, `javascript:`, `data:`, bare words).
3. `startsWith("//")` → `/` (blocks protocol-relative).
4. `includes("\\")` → `/` (blocks backslash normalization tricks).
5. Else return the same-origin path unchanged.

### Vector-by-vector verdict
| Input `next` | Result | Blocked? |
|---|---|---|
| `//evil.com` | `/` | ✅ |
| `https://evil.com` | `/` (no leading `/`) | ✅ |
| `/\evil.com` | `/` (backslash) | ✅ |
| `\/\/evil.com` | `/` (no leading `/`) | ✅ |
| `%2F%2Fevil.com` (→ `//evil.com` decoded) | `/` | ✅ |
| `javascript:alert(1)` | `/` | ✅ |
| `data:text/html,...` | `/` | ✅ |
| _(missing)_ | `/` | ✅ |

## Safe redirect examples (still work)
- `/` , `/account` , `/seller` , `/admin` , `/some/internal/path?tab=1` → returned unchanged (same-origin).

## Whether Supabase auth logic changed
- **No.** Only the redirect target is normalized. `exchangeCodeForSession`, error handling, and both `/login?error=` fallbacks are byte-identical.

## Forbidden files touched
- **None.** Only `app/auth/callback/route.ts` in scope. Other dirty `app/` files (`account/page.tsx`, `globals.css`, `page.tsx`, `shop/page.tsx`, `ai/page.tsx`, `reactbits-lab/`) are **pre-existing**, not this slice.

## Typecheck / check result (from Slice 2 report)
- `pnpm exec tsc --noEmit --incremental false` (no install): **zero errors in `app/auth/callback/route.ts`.** Remaining TS errors pre-existing/unrelated (`lib/prisma.ts`, `SKXNZ_SKILL_EXPORTS/**`).

## Residual / follow-up (not blockers)
- Reflected `error` string into `/login?error=` is `encodeURIComponent`-escaped here; final HTML-escaping is `/login`'s responsibility — separate follow-up already logged in [[SUPABASE_SECURITY_DEEP_AUDIT]]. Out of this single-file scope.
- Same `safeNextPath` pattern should be reused if/when middleware route-protection adds its own post-login redirect. Note for a later slice.

## Safe to commit
> [!success] Yes
> Minimal, correct, dependency-free, type-clean, isolated to one file. Closes M6. No disclosure caveats (unlike Slice 1 — this file carried no pre-existing edits).

## Exact files recommended for commit
```
app/auth/callback/route.ts
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_2_AUTH_CALLBACK_REDIRECT_FIX_REPORT.md
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_2_DIFF_REVIEW.md
```
> [!danger] Explicit-path staging only
> Stage each path by name. Do **not** `git add -A` / `git add .` — ~28 other pre-existing dirty files must stay out.

## Exact commit message
```
fix(auth): block open redirect via next param in auth callback

Validate the `next` query param before redirecting after
exchangeCodeForSession. Only same-origin absolute paths ("/...") are
allowed; protocol-relative ("//host"), backslash tricks, and non-path
schemes (javascript:, data:, https://) fall back to "/".

Closes M6 from SUPABASE_SECURITY_DEEP_AUDIT. No deps/config/Supabase
schema changes; auth logic and response shape unchanged.
```

---

## Related
[[SLICE_2_AUTH_CALLBACK_REDIRECT_FIX_REPORT]] · [[SUPABASE_SECURITY_DEEP_AUDIT]] · [[SLICE_1_1B_DIFF_REVIEW]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
