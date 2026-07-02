---
title: Slice 4 — H3 Env Drift Audit + .env.example Fix
date: 2026-07-02
tags:
  - report
  - security
  - env
  - config
  - supabase
  - slice
type: audit-fix
agent: skxnz-backend-auditor
status: complete
app_source_touched: .env.example
secrets_printed: false
commit: false
push: false
pr: false
---

# Slice 4 — H3 Env Drift Audit + `.env.example` Fix

> [!success] H3 closed
> `.env.example` Supabase var names now match the code exactly, with explicit server-only marking on the secret key. No real secret file opened; no secret value printed.

**Date:** 2026-07-02

## Env variables found in code (SKXNZ app only)
| Variable | Where | Class |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts:5`, `server.ts:11`, `admin.ts:7`, `middleware.ts:8` | public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `client.ts:6`, `server.ts:12`, `middleware.ts:9` | public |
| `SUPABASE_SECRET_KEY` | `admin.ts:8` | **server-only** |
| `OPENAI_API_KEY` | `src/lib/ai/provider.ts:11` | server-only |
| `AI_PROVIDER` | `provider.ts:12` | server |
| `OPENAI_MODEL` | `provider.ts:20` | server |
| `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_WAITLIST_URL` / `NEXT_PUBLIC_SELLER_APPLICATION_URL` | `lib/site.ts` | public |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx:19-20` | public |
| `DATABASE_URL` (+ Prisma `DIRECT_URL`) | `prisma/*`, `lib/prisma.ts` | server |
| `NODE_ENV` | `lib/prisma.ts:14` | runtime |

## Env documented in `.env.example` (before)
App identity (correct), `DATABASE_URL`/`DIRECT_URL` (correct), AI block (correct), Storage/Stripe/Razorpay/Analytics placeholders — **plus a broken auth/Supabase block.**

## Drift issues found
> [!danger] H3 — Supabase names in `.env.example` did not match the code
> - `SUPABASE_URL` documented, code uses **`NEXT_PUBLIC_SUPABASE_URL`** → browser client reads `undefined`; app breaks on copy-verbatim.
> - `SUPABASE_ANON_KEY` documented, code uses **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**.
> - `SUPABASE_SERVICE_ROLE_KEY` documented, code uses **`SUPABASE_SECRET_KEY`** — and it was listed with no server-only warning, next to a `NEXT_PUBLIC_CLERK_*` line, inviting a service-role key to be pasted under a public-looking name.
> - Dead placeholders contradicting the real stack: `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — SKXNZ auth is **Supabase**, not NextAuth/Clerk.

## Fixes made (`.env.example` only)
- Replaced the broken auth/Supabase block with the three real names:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co` (public)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `your-supabase-publishable-anon-key` (public)
  - `SUPABASE_SECRET_KEY` = `your-supabase-service-role-secret-key-server-only` (**SERVER ONLY**)
- Added comments: names must match `lib/supabase/*`; where to get values (dashboard → Project Settings → API); explicit "never add `NEXT_PUBLIC_` prefix / never expose to browser" on the secret.
- Removed dead `AUTH_*` / `NEXTAUTH_*` / `CLERK_*` placeholders (contradict Supabase auth).
- Placeholders only. No real keys added, none invented.

## Files edited
- `.env.example` (only app/source file)
- Vault: this report + `CURRENT_STATUS.md`, `NEXT_ACTIONS.md`, `AGENT_TASK_BOARD.md`.

## Safety ledger
- **Real secret files touched:** No (`.env`, `.env.local`, `.env.production` never opened/edited).
- **Real secrets printed:** No.
- **Server-only note:** `SUPABASE_SECRET_KEY` (+ `OPENAI_API_KEY`, `DATABASE_URL`) are server-only; secret comment added in-file.
- **Public note:** `NEXT_PUBLIC_*` values intended for the browser; publishable/anon key is safe to expose by design.

## Remaining risks
- **H2 — paise/rupees money-unit mismatch** (still open; blocks cart/order wiring).
- **Stripe placeholders** still in `.env.example` while stack uses **Razorpay** — minor/dead, low risk; prune in a later docs slice if desired.
- **`NEXT_PUBLIC_PRIVATE_BETA_MODE`** in example but not found in scanned code — verify usage or remove later (cosmetic).
- `.env.example` still not fully audited against every future integration (storage/analytics) — those are labeled future, acceptable.

## Next safe backend slice recommendation
**H2 — paise/rupees money-unit decision** (design-level: rename `price_paise` + convert seed ×100, or document rupees-MVP + convert at payments boundary). Do NOT apply catalog `0002` yet. Do NOT push.

## Commit / push / PR
- No / No / No.

## Related
[[SUPABASE_SECURITY_DEEP_AUDIT]] · [[SLICE_3_SUPABASE_LIVE_APPLY_REPORT]] · [[BACKEND_ARCHITECTURE_READONLY_AUDIT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
