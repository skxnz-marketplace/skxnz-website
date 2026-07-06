# SKXNZ - Progress Tracker

Single source of truth for project status. Read this before starting work and update it before finishing.

## Current state
- Frontend exists locally in the checkpoint repo.
- Current branch: `local-polish-auth-ui`.
- Supabase Auth Slice 1b is working locally.
- Signup, email confirmation, login, and redirect are verified.
- Supabase creates `auth.users`, `public.users`, and `public.user_profiles`.
- User role saves as `BUYER`.
- Signup now sends `name` metadata so `public.users.name` can be populated by the existing trigger.
- No push, deploy, Vercel change, or live update has happened.
- Google Workspace: `info@skxnz.com` working, `support@skxnz.com` alias working, `no-reply@skxnz.com` alias working.
- Supabase custom SMTP enabled with Google Workspace; auth confirmation email received from `SKXNZ <info@skxnz.com>`; no secrets committed.
- Catalog DB Slice 2A schema/seed/types/query-layer prepared locally (not yet applied in Supabase — see Next up).

## Done
- Built the local frontend foundation.
- Added Supabase auth layer.
- Ran/applied `0001_user_layer.sql` locally.
- Verified auth end to end: signup, email confirmation, login, redirect, user/profile rows, and `BUYER` role.
- Cleaned login/signup auth copy for real local Supabase auth.
- Added signup name metadata: `{ name: "<entered name>" }`.
- Cleaned `/account` demo copy; real-session-aware messaging via `useAuth()`.
- Name metadata fix verified working locally.
- Polished buyer-facing UI toward clean white backgrounds, tighter homepage spacing, compact marketplace cards, and sharper shared styling.
- **Catalog Slice 2A (this session):**
  - `supabase/migrations/0002_catalog_layer.sql` — brands, categories, products, product_variants, product_images, `product_status` enum, indexes, updated_at triggers, RLS on all 5 tables (public read of active/ACTIVE rows; sellers manage own products/variants/images; admin full access).
  - `supabase/seeds/0002_catalog_seed.sql` — idempotent (`on conflict do nothing`) SKXNZ-native demo brands (VANTA, AXIS, SIGNAL, MERIDIAN, HALO, KORE, etc.), 6 categories, 6 products matching existing homepage placeholder data, variants, images.
  - `supabase/verification/0002_catalog_verify.sql` — checks tables exist, RLS enabled, policies present, seed counts, active-product/variant/image queries.
  - `lib/catalog/types.ts` — Brand, Category, Product, ProductVariant, ProductImage, ProductWithRelations, ProductStatus.
  - `lib/catalog/queries.ts` — server-only query layer (getActiveBrands, getActiveCategories, getActiveProducts, getProductBySlug, getFeaturedProducts, getLimitedProducts); fails safe (empty array/null + console warning) if catalog tables don't exist yet, so homepage keeps rendering pre-migration.
  - No UI wired to this layer yet. Homepage still on `lib/home-data.ts`.

- **Day 1 / Step 27 (this session):**
  - Connected `/admin/products` to live Supabase products for PENDING_REVIEW, ACTIVE, REJECTED, and ARCHIVED moderation states.
  - Added server-side admin moderation action for approve, reject, and archive status updates.
  - Kept seller creation forced to PENDING_REVIEW and buyer catalogue/detail queries ACTIVE-only.
  - Revalidation added for `/admin/products`, `/shop`, `/seller/products`, and product detail paths after moderation.

- **Day 1 / Step 27 QA blocker fix (this session):**
  - Login now honors the `?next=` return path set by middleware (sanitized, same-origin only); previously it always redirected to `/`, which made protected seller/admin routes look "stuck on homepage".
  - Email verification now lands on `/account` via `/auth/callback?next=/account` so the signed-in state is visible.
  - Login errors mapped to clearer copy (unconfirmed email vs wrong credentials).
  - NOT code-fixable, needs manual steps: (1) QA accounts must get `SELLER`/`ADMIN` in `public.users.role` via Supabase SQL Editor; (2) `http://localhost:3000/auth/callback` must be in Supabase Auth → URL Configuration → Redirect URLs, else verification links fall back to the Site URL homepage without a session.

- **Day 1 / Step 27 route-map diagnosis (this session):**
  - Verified routes exist exactly as documented: `/seller/products`, `/seller/products/new`, `/admin/products`. No route-name mismatch.
  - Verified role plumbing end to end: middleware + `requireRole` read uppercase `public.users.role`; `AuthProvider` downcases the DB role for the client gate; localStorage demo role applies to guests only. No casing mismatch.
  - Root cause of "stays on homepage": wrong-role redirect in middleware — QA account is still `BUYER` in `public.users.role` (or its `public.users` row is missing for pre-trigger accounts). Fix is manual role SQL, not code.
  - Middleware wrong-role redirect now appends `?denied=role` so a blocked QA attempt is visible in the URL instead of a silent homepage landing.

- **Day 1 / Step 27 real-auth account cleanup (this session):**
  - `/account` rebuilt as a real server-auth page: logged out redirects to `/login?next=/account`; logged in shows real email, name, and `public.users.role` with honest per-role notes and role-appropriate workspace links. Old demo gate ("Buyer account is available only in Buyer demo mode") removed from `/account`.
  - Navbar header chip now reflects real signed-in state ("… Account" / "Signed In") instead of always showing demo labels; signed-in users get a My Account link instead of demo Switch Role buttons.
  - DemoRoleGate: signed-in users with the wrong role now see an honest "Restricted Area" card with their email and role instead of no-op demo buttons; removed the false "real authentication is not connected yet" claim.
  - SellerDashboardShell client gate now allows `seller` and `admin` (matches middleware, which admits ADMIN to `/seller/*`).
  - `/seller/products` stale copy fixed (creation is live, demo upload widget removed, Add Product action added). `/admin/products` "mock review loop" copy corrected to live.
  - Still manual: role SQL for QA accounts and Supabase redirect allowlist for localhost:3000/3001/3002 `/auth/callback`.

- **Day 1 / Step 27 role lookup diagnostics (this session):**
  - Symptom: Supabase SQL Editor shows `role = SELLER` with matching ids for info@skxnz.com, but the app showed role MISSING. SQL Editor bypasses RLS as postgres; the app reads through RLS as the signed-in user — so the app sees nothing when the row is invisible to it.
  - `lib/auth/roles.ts`: new `getCurrentUserRoleDetail()` uses `maybeSingle` and separates three cases — query error (message surfaced), row visible with role, and no visible row (row absent in the connected project OR the `"users: owner can select"` RLS policy missing live). Errors are no longer swallowed as "missing".
  - `/account` is now `force-dynamic` and shows a diagnostics card: auth user id, email, Supabase project host, `public.users` row status, `public.users.id`, and role (or the exact query error).
  - Added real Sign Out (server action `app/account/actions.ts` → `supabase.auth.signOut()` → `/login`).
  - Next: Vivaan reloads `/account` and reads the diagnostics card — it now names the exact failure instead of "MISSING".

- **Day 1 / Step 27 seller form catalog options (this session):**
  - Symptom: `/seller/products/new` showed "No active brands available" / "No active categories available", blocking product submission.
  - Code + RLS verified correct: `getActiveBrands`/`getActiveCategories` filter `is_active = true`; 0002 policies `"brands/categories: public can select active"` apply to anon AND authenticated. Root cause is data/env: the connected project has no active brand/category rows visible, or the query fails silently (helpers logged to console only).
  - Added `getActiveBrandsDetail`/`getActiveCategoriesDetail` (error vs empty distinguished) and a visible red diagnostics banner on `/seller/products/new` naming the exact problem (query error message vs "0 active rows in this project"). Page is `force-dynamic`.
  - Buyer pages were masking the same emptiness behind demo fallbacks — seller form has no fallback, which is why it surfaced here first.
  - Manual: Vivaan runs catalog verification/seed SQL (provided in session report) in the SAME project shown on `/account` diagnostics.

- **Day 1 / Step 27 seller submit unblock (this session):**
  - DB confirmed 11 active brands + 6 active categories, but the form still blocked submission (submit disabled whenever brand/category option arrays were empty, selects `required`).
  - Product owner decision: sellers should not pick brand manually long-term (brand assignment will be role/account-based later). V1 QA fallback implemented:
    - Brand/category dropdowns now optional with a default "Auto-assign (SKXNZ)" option; submit no longer gated on options loading.
    - Server action resolves missing brand to the first active brand (by name) and missing category to the first active category (by sort_order) using the seller's own RLS-scoped client (no service role). Clear error if no active rows exist.
    - Status still forced to PENDING_REVIEW, seller stays owner, buyer visibility unchanged (ACTIVE only). Honest auto-assign copy added to the create page.
  - This is a temporary V1 flow, not final seller-brand architecture.

- **Day 1 / Step 27 safe image fallback (this session):**
  - Root cause: `supabase/seeds/0002_catalog_seed.sql` seeded `product_images.url = 'placeholder://gradient'`; SafeImage passed it straight into next/image → render crash on `/shop` ("Invalid src prop … hostname \"gradient\" is not configured"). Also latent: `next.config.ts` has no `images.remotePatterns`, so ANY remote URL (e.g. seller-submitted https image) would crash the same way.
  - SafeImage rewritten with tiered handling: local `/...` paths → optimized next/image; valid http(s) URLs → next/image with `unoptimized` (no config change needed); empty/null/`placeholder://`/junk/failed loads → local SKXNZ fallback asset; if even the fallback dies → styled gradient placeholder div. next/image can no longer throw from bad catalog data.
  - All product surfaces (product card, grid, product detail shell, community, checkout demos) funnel through SafeImage — one central fix.
  - Verified: `/shop` and `/` render 200 with 0 broken images and no console errors.
  - No Supabase SQL was run and no push was performed.

- **D2-4 live product detail pages (this session — code committed, runtime QA pending):**
  - `/product/[id]` now tries an ACTIVE live Supabase product by slug first, then ACTIVE product id, then falls back to the existing demo product data if live data is missing or unavailable.
  - Added `getActiveProductBySlug()` and abort-aware live detail lookups for product, brand, category, active variants, and images so slow Supabase/network reads do not block fallback forever.
  - Live catalog rows map into the existing buyer product detail shape with truthful brand/category, image gallery, price, description, tags, active variant sizes/colors, and summed active stock.
  - Live product detail pages use buyer-safe copy: `Active Catalog` status, no demo-catalog language on the live path, checkout disabled with honest "not live yet" messaging.
  - Product card route buttons now use product slugs, which keeps demo pages working and lets live catalog cards open slug-first detail URLs.
  - Checks: secret grep on touched files clean; `git diff --check` clean except Git line-ending warnings; `tsc --noEmit` still blocked by unrelated pre-existing `lib/prisma.ts` generated-client error (`@prisma/client` has no exported `PrismaClient`).
  - No SQL was run and no push was performed.

- **D2-5 product links + live detail QA/fix pass (this session):**
  - Homepage live product cards (`mapProductToHomeProduct`) now link to `/product/{slug}` instead of hardcoded `/shop`; static demo fallback cards still intentionally point to `/shop`.
  - Confirmed D2-4 already fixed live-vs-local priority in the product detail shell (`seedProduct?.dataSource === "live"` wins; local marketplace product remains the fallback for seller/local-only previews).
  - Added minimal null-safety in `mapCatalogProductToBuyerProduct` / `mapProductToHomeProduct`: `price_inr ?? 0`, `stock_quantity ?? 0`, `sort_order ?? 0`, `tags ?? []`.
  - D2-4's 2.5s live-lookup timeout reviewed and kept; watch for premature demo fallback on cold Supabase starts.
  - No SQL was run and no push was performed.

## Next up
1. Manually QA the product approval flow with one seller-created PENDING_REVIEW product and one ADMIN account.
2. Regenerate/fix Prisma client so `lib/prisma.ts` typecheck can pass again (`PrismaClient` is currently not exported from generated `@prisma/client`).
3. Browser-QA one live ACTIVE product slug and one demo fallback product after the local Windows dev-server launch friction is resolved.
4. Review remaining pre-existing ReactBits lint warnings.
5. No push or deploy without user approval.
