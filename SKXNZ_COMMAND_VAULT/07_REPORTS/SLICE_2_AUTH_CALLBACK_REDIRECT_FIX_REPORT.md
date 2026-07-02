---
title: Slice 2 — Auth Callback Open-Redirect Fix
date: 2026-07-02
tags:
  - report
  - slice
  - security
  - auth
  - open-redirect
type: report
agent: skxnz-backend-auditor
status: complete
app_source_touched: app/auth/callback/route.ts
commit: false
push: false
pr: false
---

# Slice 2 — Auth Callback Open-Redirect Fix

> [!abstract] Scope
> Single-file backend/security slice. Only `app/auth/callback/route.ts` edited. Resolves M6 from [[SUPABASE_SECURITY_DEEP_AUDIT]] (open-redirect via unvalidated `next` param).

## File edited
- `app/auth/callback/route.ts`

## Redirect risk found
The route read `next` straight from the query string (`searchParams.get("next") ?? "/"`) and redirected with `` `${origin}${next}` `` after a successful `exchangeCodeForSession`. A crafted `next` like `//evil.com` or `/\evil.com` is treated by browsers as a **protocol-relative** target, so `${origin}//evil.com` sends the freshly-authenticated user to an attacker-controlled host — a classic **open redirect** usable for phishing / token-context handoff. Values like `javascript:` / `data:` / `https://evil.com` were also passed through unvalidated.

## Fix applied
Added a pure `safeNextPath()` guard; `next` now runs through it before use. No imports added, no Supabase auth logic changed, response shape unchanged.

```ts
function safeNextPath(raw: string | null): string {
  if (!raw) return "/"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/"
  if (raw.includes("\\")) return "/"
  return raw
}
// ...
const next = safeNextPath(searchParams.get("next"))
```

Rules enforced:
- Must be root-relative (`startsWith("/")`) → rejects `https://`, `javascript:`, `data:`, bare words.
- Must not be protocol-relative (`//host`) → rejects `//evil.com`.
- Must contain no backslash → rejects `/\evil.com`, `\/\/evil.com` and browser backslash-normalization tricks.
- Anything unsafe or missing → safe default `/`.

## Safe redirect examples (allowed)
- `/` → `/`
- `/account` → `/account`
- `/seller` → `/seller`
- `/admin` → `/admin`
- `/some/internal/path?tab=1` → unchanged (same-origin path)

## Unsafe redirect examples (now blocked → `/`)
- `//evil.com`
- `https://evil.com`
- `/\evil.com`
- `\\evil.com`
- `javascript:alert(1)`
- `data:text/html,...`
- `` (missing) → `/`

> [!note] Error path unchanged
> The `/login?error=` redirects (lines for failed exchange / no-code) always target a fixed internal `/login` path, so they carry no `next`-based redirect risk and were left as-is. Reflected `error` string escaping in `/login` is a separate follow-up noted in [[SUPABASE_SECURITY_DEEP_AUDIT]] (out of this single-file scope).

## Test / check result
- `git diff -- app/auth/callback/route.ts`: only the guard function + one-line `next` assignment changed. No import/route-shape/response change.
- `pnpm exec tsc --noEmit --incremental false` (no install): **zero errors in `app/auth/callback/route.ts`.** All reported TS errors are pre-existing and unrelated (`lib/prisma.ts` Prisma client typing, `SKXNZ_SKILL_EXPORTS/**` skill-fixture files) — outside this slice.

## App/source touched
- **Only `app/auth/callback/route.ts`.**

## Forbidden files touched
- **No.** No `app/page.tsx`, `app/login/`, `app/signup/`, `components/`, `src/`, `lib/`, `supabase/`, `scripts/`, `package.json`, `pnpm-lock.yaml`, `tailwind.config.ts`, `components.json`.

## Commit / push / PR
- No / No / No.

## Related
[[SUPABASE_SECURITY_DEEP_AUDIT]] · [[SLICE_1_AND_1B_STATUS_UPDATE]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
