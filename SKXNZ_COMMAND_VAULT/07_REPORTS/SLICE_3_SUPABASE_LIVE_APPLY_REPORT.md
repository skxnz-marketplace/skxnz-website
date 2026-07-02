---
title: Slice 3 — Supabase Live Apply Report
date: 2026-07-02
tags:
  - report
  - supabase
  - rls
  - migration
  - live-apply
  - security
type: live-apply-report
agent: skxnz-report-writer
status: complete
migration_applied: true
commit: false
push: false
pr: false
---

# Slice 3 — Supabase Live Apply Report

> [!success] H1 resolved in live DB
> Migration `0003` applied in Supabase SQL Editor and verified. Recursive admin RLS on `public.users` is fixed. No secrets exposed; no frontend/package/config touched.

**Date:** 2026-07-02

## Apply summary
- **Migration applied:** `supabase/migrations/0003_fix_admin_rls_helper.sql`
- **Commit hash:** `01ed642` — `fix(rls): add is_admin helper and de-recurse public users admin policy`
- **Live Supabase apply status:** ✅ Successful (manual SQL Editor, per [[SLICE_3_SUPABASE_MANUAL_APPLY_GUIDE]])
- **Method:** SQL Editor only — no CLI/ORM. No other migration run in this step.

## Verification query results
| # | Check | Result |
|---|---|---|
| 1 | `public.is_admin` exists | ✅ present |
| 2 | `prosecdef` (SECURITY DEFINER) | ✅ `true` |
| 3 | `proconfig` search_path | ✅ includes `search_path=public` |
| 4 | policy `"users: admin can select all"` exists | ✅ present |
| 5 | policy `using_expr` | ✅ `is_admin()` |
| 6 | `select count(*) from public.users` | ✅ `6` |
| 7 | recursion error | ✅ none (`infinite recursion` NOT raised) |

## public.is_admin function status
- Live, `SECURITY DEFINER`, `set search_path = public`, `stable`, enum-safe (`role::text = 'ADMIN'`), anon-safe (null `auth.uid()` → false). Reads `public.users` as owner → RLS bypass inside helper → no self-recursion.

## Admin policy status
- `"users: admin can select all"` on `public.users` now `for select using ( public.is_admin() )`. Same admin intent (admins read all users); non-admins fall to owner-only policy. No recursive sub-select remaining.

## public.users count result
- **6 rows** returned cleanly — proves reads execute without the prior recursion path.

## RLS recursion status
- **Fixed.** H1 ([[SUPABASE_SECURITY_DEEP_AUDIT]]) closed in live DB. RLS remains **enabled** on all existing tables; no broad public access added.

## Security ledger
- **No secrets exposed** — service-role/secret key never printed, selected, or referenced. Helper leaks only a boolean about the caller.
- **No frontend / package / config touched** — apply was SQL Editor action + vault docs only.

## Remaining backend risks (open)
- **H2 — money unit mismatch (paise vs rupees):** `products.price_inr` stores rupees; hard rule mandates integer paise. Dormant (no orders/payments yet) but a 100x time-bomb. Decide before checkout schema.
- **H3 — `.env.example` drift:** var names don't match real code (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SECRET_KEY`); dead Clerk/NextAuth/Stripe/Prisma placeholders. Secret-hygiene risk.
- **Catalog `0002` migration:** authored, **NOT applied**, LOCKED. Catalog admin policies (M7, ~20 duplicated but non-recursive) `is_admin()` repoint deferred until after `0002` applied.
- **Seeds / verification:** `supabase/seeds/`, `supabase/verification/` still separate untracked, not applied.

## Next recommended backend slice
**H3 — `.env.example` drift audit/fix** (safest next: docs-only file, no schema/live-DB change, zero runtime risk), **or** **H2 — paise/rupees decision** (higher value but design-level; blocks cart/order wiring). Recommend **H3 first** (trivial, isolated), then H2 as a design slice. Do **not** apply catalog `0002` yet.

## Commit / push / PR
- No / No / No. (Migration already committed locally at `01ed642`; this report is a live-apply record, uncommitted.)

## Related
[[SLICE_3_SUPABASE_RLS_ADMIN_FIX_REPORT]] · [[SLICE_3_DIFF_REVIEW]] · [[SLICE_3_SUPABASE_MANUAL_APPLY_GUIDE]] · [[SUPABASE_SECURITY_DEEP_AUDIT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
