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

- **Day 3 / D3-1 buyer cart + checkout foundation (this session, branch `day3-cart-order-flow`):**
  - Live ACTIVE catalog products can now be added to the cart: `addToCart` accepts a full product snapshot for `dataSource: "live"` products (they are not in the browser-local demo catalog), while demo products keep the existing approved-only rule.
  - Cart items store stable snapshots (product id/slug, size, color, quantity, price in paise, image/title/brand) in `localStorage` under `skxnz-marketplace-cart`; live snapshots are kept as-stored on rehydrate instead of being demo-media-normalized.
  - Product detail purchase panel: products with more than one size now require an explicit size choice (button reads "Select A Size" and stays disabled until picked); Add To Cart works for live products; premium "Added to cart" success state with error styling for failures.
  - Honest stock: added optional `Product.variantCount` (set from real variant rows in `mapCatalogProductToBuyerProduct`); live products without variant rows show "Stock data being connected" with no unit count and are not falsely blocked; live products with variants use real summed stock (out-of-stock disables Add To Cart).
  - Cart page/table copy moved from "demo checkout" to truthful "checkout review" language: Subtotal / Delivery "Calculated at a later step" / Estimated total; CTA is "Continue To Checkout Review"; Save For Later hidden for live items (wishlist can't render live products yet).
  - Checkout `/checkout` remains the existing honest internal-test-order shell (shipping, demo-payment placeholders, review); no fake payment success and no fake production order claims. Navbar cart badge already counts live cart quantity.
  - Verified in local dev server: size gating, add to cart, badge count, qty increment, remove, empty state, persistence across reload, checkout shell rendering with cart summary. No console errors.
  - Checks: `tsc --noEmit` clean except the pre-existing `lib/prisma.ts` `PrismaClient` export error; secret grep clean (only server-side `lib/supabase/admin.ts` env read). No SQL was run and no push was performed.

- **Day 3 / D3-2 checkout draft foundation (this session, branch `day3-cart-order-flow`):**
  - `/checkout` upgraded from the demo test-order wizard to a single checkout review page (`components/checkout/checkout-draft-flow.tsx`): contact details (name/phone/email), shipping address (line1, optional line2, city, state, pincode, country defaulting to India), optional delivery note, cart summary sidebar.
  - New `lib/checkout/checkout-draft.ts`: `skxnz-checkout-draft` localStorage draft with sanitized read/write/clear and V1 client-side validation (required fields, phone digits 7-15, email format, pincode digits 4-10).
  - Draft auto-persists as the buyer types; "Save Checkout Draft" validates and shows "Checkout draft ready" (or highlights missing fields). Refresh restores entered details.
  - Summary is honest: Subtotal, Delivery "Calculated at live checkout", Taxes "Calculated at live checkout", "Estimated payable" = subtotal only, labeled as an estimate before payment.
  - Payment step is a clearly disabled "Continue To Secure Payment" button with helper "Live payment connection is next. No order is placed yet." No order creation, no fake order ID, no payment success state anywhere on the new path.
  - Empty cart shows a premium empty checkout state with a CTA back to `/shop`.
  - Old `DemoCheckoutFlow` / `/checkout/success` files remain on disk but are no longer routed from `/checkout`.
  - Verified in local dev server: empty state, all form sections, country default, 7-field validation errors, draft save + ready status, disabled CTA, refresh persistence of draft fields. No console errors.
  - Checks: `tsc --noEmit` clean except pre-existing `lib/prisma.ts` `PrismaClient` error; secret grep clean on checkout files. No SQL was run and no push was performed.

- **Day 3 / D3-3 buyer order readiness shell + checkout handoff (this session, branch `day3-cart-order-flow`):**
  - New future-safe types in `lib/orders/order-readiness.ts`: `OrderLineItemSnapshot`, `OrderIntentDraft`, `CheckoutReviewStage` (`draft` | `review`), `CheckoutReviewSnapshot` (versioned). Pure types only — no order is created, no order id / payment / delivery is invented. All amounts are integer paise.
  - New `lib/checkout/checkout-review.ts`: device-local `skxnz-checkout-review` snapshot built from cart items (`unitPriceCents`) + the existing `skxnz-checkout-draft`. `build/read/write/clear` helpers; explicitly NOT an order. Subtotal is summed line paise (estimate before delivery + tax).
  - `/checkout` handoff improved: saving a valid draft now also writes the `skxnz-checkout-review` snapshot, the ready state gained honest copy ("No order is placed and no payment is taken yet") plus a "See Order Readiness" link to `/orders`, and a new "What happens next" panel (`components/checkout/checkout-next-steps.tsx`) lists secure payment / live order creation / delivery partner assignment — each tagged Upcoming, none active.
  - `/orders` gained `components/orders/order-readiness-panel.tsx` (rendered above the existing seeded demo table): honest "Order history will appear after live payment is connected" state, CTA back to `/shop`, CTA to `/cart` only when the cart has items, and a "Saved checkout review (Not an order)" block with estimated subtotal + a link back to `/checkout` when a review snapshot exists. No fake order rows added by this slice.
  - Intentionally disabled / not faked: no order placement, no payment success, no delivery ETA, no tracking number, no production order IDs; payment button stays disabled; Razorpay not wired.
  - localStorage keys: reads existing `skxnz-checkout-draft` + cart; adds `skxnz-checkout-review` (review snapshot, never called an order).
  - Checks: `tsc --noEmit` clean except pre-existing `lib/prisma.ts` `PrismaClient` export error (unrelated, not fixed); secret grep on `app/orders app/account components/checkout components/orders lib/checkout lib/orders` clean. No SQL was run and no push was performed. Did not touch admin/seller/auth/middleware/migrations or Day 2 catalog pages.

- **Day 3 / D3-4 buyer purchase-flow honesty cleanup (this session, branch `day3-cart-order-flow`):**
  - `/orders` no longer renders the seeded demo order table (`BuyerOrdersPanel`); the page now shows only the honest `OrderReadinessPanel` (empty history / saved checkout review states) with truthful intro copy ("SKXNZ does not show placeholder or mock orders here").
  - `/orders/[id]` no longer renders `OrderDetailShell` (mock order with real-looking statuses/timeline); it now shows an honest "No order exists at this address" card with CTAs to `/orders` and `/shop`.
  - `/checkout/success` no longer renders `DemoCheckoutSuccess`; replaced with an honest "No order has been placed" status page ("Live payment is not connected yet. Nothing was charged...") with CTAs to `/checkout`, `/cart`, `/shop`. Metadata retitled to "Checkout Status".
  - Demo components (`buyer-orders-panel.tsx`, `order-detail-shell.tsx`, `demo-checkout-success.tsx`, `demo-checkout-flow.tsx`) remain in the repo but are no longer imported from any `app/` route (verified by grep — only NOTE comments mention them).
  - Copy scan of orders/checkout surfaces: remaining "placed/paid/tracking/order id/success" wording is all negative or future framing ("No order is placed yet", "Order IDs are issued by the backend... Not active yet").
  - Checks: `tsc --noEmit` clean except pre-existing `lib/prisma.ts` `PrismaClient` error; secret grep clean. No SQL, no push. Admin/seller/auth/middleware/migrations/Day 2 catalog untouched.
  - Known limitation: `/account/orders` still renders `OrderHistoryDemo` (labeled as demo) — outside this slice's allowed scope; flag for a follow-up honesty pass.

- **Day 3 / D3-5 account order history honesty cleanup (this session, branch `day3-cart-order-flow`):**
  - `/account/orders` no longer renders `OrderHistoryDemo` (seeded buyer order placeholders + local demo checkout order). Page now reuses the honest `OrderReadinessPanel` inside `AccountShell` with truthful copy: "No order has been placed yet." / "Order history will appear here after live payment is connected. SKXNZ does not show placeholder or mock orders."
  - Panel provides CTA to `/shop`, CTA to `/cart` when cart has items, and the "Saved checkout review (Not an order)" block when a `skxnz-checkout-review` snapshot exists.
  - `OrderHistoryDemo` component stays on disk but is no longer imported from any route (grep: only its own definition + a NOTE comment).
  - Preview verification blocked: middleware redirects `/account/orders` to `/login`, and Supabase is unreachable from this dev machine, so the logged-in render could not be checked in-browser. Route compiles and typechecks.
  - Checks: `tsc --noEmit` clean except pre-existing `lib/prisma.ts` `PrismaClient` error; secret grep clean. No SQL, no push.

- **Day 3 / D3-6 Prisma typecheck blocker fixed (this session, branch `day3-cart-order-flow`):**
  - Root cause: Prisma client was never generated on this machine — `@prisma/client` (installed v6.19.3) is a stub that re-exports from the generated `.prisma/client`, which was missing, so `PrismaClient` had no export and `lib/prisma.ts(1,10)` failed typecheck.
  - Fix: ran `pnpm exec prisma generate` (no DB connection needed) and added `"postinstall": "prisma generate"` to package.json so fresh installs and Vercel builds regenerate the client automatically. No schema, dependency, or app-code changes; generated client stays in node_modules (not committed).
  - `pnpm exec tsc --noEmit` now passes with ZERO errors — the long-standing pre-existing blocker is cleared. Next-up item 4 is done.

- **Day 4 / D4-1 internal commerce backend foundation (this session, branch `day3-cart-order-flow`):**
  - **DRAFT migration `supabase/migrations/0005_commerce_layer.sql` — NOT APPLIED.** 7 tables: `orders`, `order_items`, `order_events`, `support_tickets`, `support_ticket_messages`, `return_requests`, `return_request_items`. All uuid PKs, integer-paise amounts with non-negative checks, status/category/priority check constraints, `set_updated_at` triggers, indexes. `orders.buyer_id` references `public.users` with NO cascade (financial records survive). Currency locked to INR.
  - RLS on all 7 tables: buyers select own rows only (direct `auth.uid()` or via parent order/ticket/request); buyers can insert only their own pre-payment orders (`DRAFT`/`PAYMENT_PENDING` enforced in policy), OPEN tickets, BUYER-role messages, REQUESTED returns; NO buyer update policy on orders (status transitions server-side only); NO buyer insert on `order_events`; admin via existing `public.is_admin()`; `revoke all ... from anon` on every table; `authenticated` granted only select/insert (select-only on order_events) — no update/delete grants.
  - Verification draft `supabase/verification/0005_commerce_layer_verify.sql`: tables exist, RLS enabled, policy counts + full listing, anon zero-grant check, authenticated grant surface, check constraints, triggers, and a manual 2-user cross-buyer isolation script (buyer B cannot read/insert/update buyer A's orders; anon denied).
  - TypeScript: `lib/orders/order-intent.ts` (`CheckoutContactSnapshot`, `ShippingAddressSnapshot`, `OrderLineItemInput`, `CreateOrderIntentInput`, `CreateOrderIntentResult`, `validateOrderIntentInput` with paise/line-total/subtotal integrity checks reusing `validateCheckoutDraft`, `mapCheckoutDraftToOrderIntent` from cart + checkout draft); `lib/support/support-requests.ts` (`CreateSupportTicketInput`, category/status constants, `validateSupportTicketInput`); `lib/returns/return-requests.ts` (`CreateReturnRequestInput`, `ReturnRequestItemInput`, status constants, `validateReturnRequestInput`).
  - Server action skeleton `lib/orders/create-order-intent.ts` (`"use server"`): validates input, documents the exact future insert payload, returns `{ ok: false, code: "NOT_WIRED" }` — never invents an order id, never claims payment. Not imported by any UI; checkout payment CTA remains disabled. `buyer_id` will be session-derived server-side, never client input. `PAID` reserved for the future signature-verified webhook handler.
  - Intentionally NOT done: no SQL applied, no `supabase db push`, no Razorpay, no delivery partner, no UI enablement, no fake success states.
  - Checks: `tsc --noEmit` ZERO errors; secret grep clean on all new files. No SQL run, no push.
  - **Tomorrow's manual apply/test steps:**
    1. Supabase Dashboard → SQL Editor → New query → paste `supabase/migrations/0005_commerce_layer.sql` → Run once.
    2. Same editor → paste `supabase/verification/0005_commerce_layer_verify.sql` → run queries 1–8, compare with EXPECT comments.
    3. Run the manual cross-buyer isolation script (verification section 9) with two test buyer accounts.
    4. Only after all pass: wire the real insert into `lib/orders/create-order-intent.ts` via `lib/supabase/server` client and re-verify.

## Next up
1. Wire wishlist to accept live product snapshots so Save For Later can return for live cart items.
2. Real backend order path (orders table + server-side order creation) before any order confirmation UI; then Razorpay integration.
3. Manually QA the product approval flow with one seller-created PENDING_REVIEW product and one ADMIN account.
4. Regenerate/fix Prisma client so `lib/prisma.ts` typecheck can pass again (`PrismaClient` is currently not exported from generated `@prisma/client`).
5. Browser-QA one live ACTIVE product slug end-to-end into the cart once Supabase is reachable from the dev machine.
6. Review remaining pre-existing ReactBits lint warnings.
7. No push or deploy without user approval.
