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
  - No Supabase SQL was run and no push was performed.

## Next up
1. Manually QA the product approval flow with one seller-created PENDING_REVIEW product and one ADMIN account.
2. Run `0002_catalog_layer.sql` in Supabase SQL Editor, then `0002_catalog_seed.sql`, then `0002_catalog_verify.sql` if the catalog tables are not already applied.
3. Review remaining pre-existing ReactBits lint warnings.
4. No push or deploy without user approval.
