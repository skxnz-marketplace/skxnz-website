---
title: SKXNZ Supabase Foundation Sprint 6A Report - 3 July 2026
date: 2026-07-03
tags:
  - report
  - supabase
  - backend
  - security
  - rls
  - route-protection
  - sprint-6a
type: sprint-report
branch: local-polish-auth-ui
supabase_live_applied: false
commit: false
push: false
pr: false
---

# SKXNZ Supabase Foundation Sprint 6A Report — 3 July 2026

> [!abstract] Outcome
> Server-side auth/route protection now real (middleware + `public.users.role`), replacing demo-role as the production gate. AI header role-spoof disabled in prod. Catalog `0002` verified end-to-end — **safe for later first-time manual apply, NOT applied live**. 3 code files changed (Step 3) + 1 report. No SQL edited. No live Supabase action.

**Date:** 2026-07-03
**Branch:** `local-polish-auth-ui` (not `main`)

## Starting git status
- 6 prior slice commits intact (`e24526d`→`5f53ca4`). None pushed.
- Working tree dirty: ~28 modified app/source + many untracked (pre-existing).

> [!warning] Dirty-tree warning
> ~60+ pre-existing modified/untracked files remain **local and untouched** (UI polish, `components/**`, `package.json`, `pnpm-lock.yaml`, `tailwind.config.ts`, `lib/catalog/**`, `supabase/0002`+seeds, reactbits, vault reports). Do NOT `git add -A` / `reset` / `stash`. Stage only Sprint 6A files by explicit path.

## Files inspected
- Clients: `lib/supabase/{client,server,admin}.ts`
- Auth: `middleware.ts`, `app/auth/callback/route.ts`, `app/{login,signup}/page.tsx`, `components/auth/auth-card.tsx`, `components/auth/demo-role-gate.tsx`, `app/{admin,seller}/login/page.tsx`
- Role: `lib/auth/roles.ts` (new), `src/lib/ai/safety.ts`, `lib/demo-role.ts`
- Migrations: `supabase/migrations/{0001,0002,0003}.sql`, `supabase/seeds/0002_catalog_seed.sql`, `supabase/verification/0002_catalog_verify.sql`
- Catalog code: `lib/catalog/{types,mappers,queries}.ts`, `scripts/check-catalog-connection.ts`

## Step 2 — Auth audit summary
- ✅ Client key isolation correct: browser/SSR use anon/publishable; service-role only in `admin.ts` (server-only, no client import).
- ✅ Callback open-redirect closed (`safeNextPath`, commit `e64ec62`).
- ✅ Real auth wired: `signUp`/`signInWithPassword`, email confirm, same-origin `emailRedirectTo`.
- ✅ Signup trigger `handle_new_auth_user` (0001): `security definer`, `search_path=public`, creates `public.users` (BUYER) + `public.user_profiles`.
- ❌ Found: middleware protection commented out; protected pages relied on client `DemoRoleGate`/localStorage; no server role helper; `safety.ts` trusted spoofable `x-skxnz-demo-role`.

## Step 3 — Route/role protection changes (3 files)
- **NEW `lib/auth/roles.ts`** — server-only: `getCurrentUser`, `getCurrentUserRole` (reads `public.users.role`), `requireUser`, `requireRole`, `toAppRole` (lowercase for display only). No localStorage/headers/client-claims/service-key. Safe-relative redirect guard.
- **`middleware.ts`** — live gate after `getUser()`: needs-user prefixes `/account`,`/orders`,`/returns`,`/wishlist`,`/admin`,`/seller`; logged-out → `/login?next=<safe-relative>`; `/admin`→ADMIN, `/seller`→SELLER|ADMIN (role from `public.users`); wrong role → `/`; `/admin/login`+`/seller/login` excluded; static/_next matcher unchanged.
- **`src/lib/ai/safety.ts`** — `getDemoRoleFromHeaders()` returns `null` when `NODE_ENV==="production"`; demo header honored dev/preview only.
- Demo-role components kept as UI-only preview (server is now real gate); swapping page-level gates → `requireRole()` deferred to a later slice.

## Step 4 — Catalog 0002 verification summary
- Tables ✅ brands, categories, products, product_variants, product_images (+ indexes, timestamps, constraints, FKs).
- Seller ownership ✅ `products.seller_id → public.users`; variants/images via parent product.
- RLS ✅ enabled all 5; public-select-active, seller-own (`auth.uid()=seller_id`), admin-full.
- Money ✅ `price_inr` = rupees; code converts `*100` → paise (`mappers.ts`), matches Slice 5 rule.
- Seed ✅ idempotent, SKXNZ-native placeholder brands (no real-brand claims). Verify SQL ✅ read-only, names match.
- Schema ↔ `lib/catalog` code = full match, no drift.
- ⚠️ Not rerunnable (no `if not exists`) — fine for **first** apply. Moderation enum limited to DRAFT/ACTIVE/ARCHIVED (MVP-ok).
- No edits needed.

## RLS / security status
1. `public.users` admin policy non-recursive after `0003` (`using ( public.is_admin() )`). ✅
2. `public.is_admin()` exists, `security definer`, `search_path=public`, STABLE. ✅
3. RLS enabled: users, user_profiles, addresses (0001) + 5 catalog tables (0002). ✅
4. Own-row access: `auth.uid()=id` / `=user_id`. ✅
5. Catalog policies use `auth.uid()`+DB role — no client claims. ✅
6. Seller ownership = `auth.uid()=seller_id`, not localStorage/demo. ✅
7. Admin = DB role, not headers. ✅
8. Middleware blocks logged-out on /account,/orders,/returns,/wishlist; non-admin on /admin; non-SELLER/ADMIN on /seller. ✅
9. `/cart` intentionally public — guest cart is localStorage by design. ✅
10. `safety.ts` does not trust `x-skxnz-demo-role` in production. ✅

**Verdict: RLS + route/role foundation SOUND for MVP.** No recursive policy, no client-trust authz, service-role isolated.

## Typecheck status
`npm run typecheck` — **zero errors in the 3 changed files** (`middleware.ts`, `lib/auth/roles.ts`, `src/lib/ai/safety.ts`).
**Pre-existing / unrelated errors remain — build is NOT clean:**
- `lib/prisma.ts` — `@prisma/client` has no exported `PrismaClient` (known Prisma/client issue, not today's work).
- `SKXNZ_SKILL_EXPORTS/_upstream/impeccable/**` — bundled skill test fixtures (astro/vite/styled-components/nuxt), not app code.
Not caused by Sprint 6A.

## Supabase live SQL status
- **No live apply this sprint.** No migration created or edited.
- `0001` + `0003` already live (prior). `0002` verified, **NOT applied**.

## Catalog manual apply order (later, Supabase SQL Editor — first-time only, NOT now)
1. `supabase/migrations/0002_catalog_layer.sql`
2. `supabase/seeds/0002_catalog_seed.sql`
3. `supabase/verification/0002_catalog_verify.sql`
   Expect: 5 tables, `rls_enabled=true` ×5, policies per table, counts brand=11 / category=6 / product=6 / variant=8 / image=6.

## Remaining risks
- Page-level `DemoRoleGate` still on protected pages (UI preview only now; middleware is the real gate) — swap to `requireRole()` in a later slice.
- `0002` not rerunnable — first-time apply only; a re-apply needs an idempotent variant.
- Catalog admin RLS duplicated ~20× (M7) — cosmetic, could repoint to `public.is_admin()` later. Not a blocker.
- Money: `price_inr` rupees vs app paise — guardrailed (`lib/money.ts` + mappers), not yet enforced at a checkout boundary (no checkout built).
- Build not clean due to pre-existing Prisma + skill-fixture errors.
- **No payments/orders/checkout built — do not claim as live.**

## Next sprint recommendation (6B)
1. Apply `0002` live (order above) + record verified apply (like Slice 3 guide).
2. Wire `lib/catalog/queries.ts` into shop/product pages with `lib/home-data.ts` fallback.
3. Swap page-level `DemoRoleGate` → server `requireRole()` on `/admin`,`/seller`.
4. Resolve Prisma-vs-Supabase ownership; fix `lib/prisma.ts` build error or remove Prisma.
5. **Graphify remains deferred** until the backend commit is clean.

## Related
[[SLICE_3_SUPABASE_LIVE_APPLY_REPORT]] · [[SUPABASE_SECURITY_DEEP_AUDIT]] · [[BACKEND_ARCHITECTURE_READONLY_AUDIT]] · [[SLICE_5_H2_MONEY_UNIT_AUDIT_FIX_REPORT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]]
