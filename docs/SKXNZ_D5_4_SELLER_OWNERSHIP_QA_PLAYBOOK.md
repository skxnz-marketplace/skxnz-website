---
tags: [skxnz, backend, frontend, qa]
---

# SKXNZ D5-4 Seller Ownership QA Playbook

Compact QA/index for seller real-product ownership cleanup. Scope: inspect only; do not edit runtime app code, actions, migrations, `PROGRESS.md`, commits, or pushes.

Related: [[SKXNZ_D5_1_WISHLIST_QA_PLAYBOOK]] · [[SKXNZ_D5_3_SUPPORT_RETURNS_QA_PLAYBOOK]] · [[SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK]]

## Current Read

- Current live Supabase ownership key is `public.products.seller_id`, mapped in app types as `Product.seller_id`.
- Seller product reads use `getSellerProductsWithRelations()` and explicitly filter `products.seller_id = auth.uid()`.
- Seller product creation uses `createSellerProduct()` and inserts `seller_id: user.id`, `status: "PENDING_REVIEW"`, then variants/images.
- Buyer catalog reads remain `status = "ACTIVE"` only; seller/admin review states stay out of buyer queries.
- Seller orders use `order_items.product_id -> products.id -> products.seller_id`, not a seller profile table.
- Legacy Prisma/demo schema still uses `seller_profile_id`; do not confuse that with the current Supabase seller ownership path.
- Base catalog migration `0002_catalog_layer.sql` is referenced by comments/types but is not present in this worktree's `supabase/migrations` listing. Follow-on migrations assume it exists in the target DB.
- Useful existing SQL aid: `supabase/verification/0008_seller_product_ownership_verify.sql`.

## 1. Seller Product Files

### Seller product pages

- `/seller` -> `app/seller/page.tsx`
  - Beta/demo control center.
  - Renders `SellerProductTable` without `liveProducts`, so it falls back to browser-local/demo provider catalog.
  - Renders `SellerOrderTable`, also demo/provider based.
  - QA risk: do not use `/seller` alone to prove live seller ownership.
- `/seller/dashboard` -> `app/seller/dashboard/page.tsx`
  - Reads `getSellerProductsWithRelations()`.
  - Passes `liveProducts` into `SellerProductTable`.
- `/seller/products` -> `app/seller/products/page.tsx`
  - Main live seller product route.
  - Reads `getSellerProductsWithRelations()`.
  - Empty state: "No seller-owned products were found in Supabase for this account yet."
- `/seller/products/new` -> `app/seller/products/new/page.tsx`
  - Loads active brands/categories.
  - Renders `ProductUploadForm` with `createSellerProduct`.
  - Copy states the server sets owner and forces `PENDING_REVIEW`.

### Seller dashboard product components

- `components/seller/seller-product-table.tsx`
  - With `liveProducts`: Supabase-owned rows, read-only actions.
  - Without `liveProducts`: demo provider rows, edit/remove demo buttons.
- `components/forms/product-upload-form.tsx`
  - Live submit only when an action is supplied.
  - AI validation endpoint is preview/demo assist, not ownership authority.
- `components/seller/seller-product-workspace.tsx`
  - Older demo wrapper; uses `ProductUploadForm` without live action.
- `components/seller/seller-product-upload-demo.tsx`
  - Browser-local demo submission path.

### Seller product actions

- `app/seller/products/new/actions.ts`
  - `requireRole(["SELLER", "ADMIN"], "/seller/products/new")`.
  - Parses form server-side.
  - Inserts into `products` with `seller_id: user.id`, resolved `brand_id`, `category_id`, `status: "PENDING_REVIEW"`.
  - Inserts first `product_variants` row and optional `product_images` row.
  - Revalidates `/seller/products` and `/seller/dashboard`; redirects to `/seller/products`.
  - Admin can create here too; if admin uses this route, products become admin-owned by `seller_id`.

### Seller product read helpers

- `lib/catalog/queries.ts`
  - `getSellerProductsWithRelations()`: current user, `products.seller_id = user.id`, then related brands/categories/variants/images.
  - `getAdminProductsForReview()`: admin queue for `PENDING_REVIEW`, `ACTIVE`, `REJECTED`, `ARCHIVED`.
  - `getActiveProducts*()`, detail, and search helpers: buyer-facing `status = "ACTIVE"` only.
- `lib/catalog/types.ts`
  - Product fields include `seller_id`, `brand_id`, `category_id`, `status`, prices, images, timestamps.

## 2. Product Ownership Schema

### Current Supabase product ownership

- `public.products.seller_id`
  - Expected FK: `seller_id -> public.users(id)` per `supabase/verification/0008_seller_product_ownership_verify.sql`.
  - Used by seller product reads, seller product write policies, and seller order visibility.
- `public.products.brand_id`
  - Brand association, not seller ownership.
- `public.products.category_id`
  - Category association, not seller ownership.
- Related rows:
  - `product_variants.product_id -> products.id`
  - `product_images.product_id -> products.id`
  - Seller RLS on variants/images checks parent `products.seller_id`.

### Seller/brand relationship tables

- Current Supabase seller ownership path does not use a separate seller/brand mapping table.
- `supabase/verification/0005_commerce_layer_preflight.sql` states: no separate store/seller mapping table is used; `products.seller_id` is the link.
- Legacy Prisma schema has `SellerProfile` mapped to `sellers`, with `brand_id`, and `Product.seller_profile_id`.
- Treat Prisma `seller_profile_id` as legacy/demo architecture unless a future task explicitly rewires runtime code to Prisma.

### Migrations and verification files to inspect

- `supabase/migrations/0004_seller_product_lifecycle.sql`
  - Adds `PENDING_REVIEW` and `REJECTED` to `product_status`.
  - Seller insert/update only for own `DRAFT` or `PENDING_REVIEW` products.
  - Seller variant/image insert/update/delete only through parent owned draft/pending product.
  - Admin insert/update/manage policies use `public.is_admin()`.
- `supabase/migrations/0005_commerce_layer.sql`
  - Creates `orders`, `order_items`, events/support/returns tables.
  - RLS enabled on commerce tables.
  - Seller order item policy originally joined `orders` + `products` and required `products.seller_id = auth.uid()` plus post-payment status.
- `supabase/migrations/0006_fix_seller_order_item_rls.sql`
  - Fixes seller order line visibility using `public.seller_owns_post_payment_order_line(order_id, product_id)`.
  - Keeps sellers unable to read `orders` directly.
  - Keeps draft/payment-pending and unrelated product lines hidden.
- `supabase/verification/0004_seller_product_lifecycle_verify.sql`
  - Checks product/variant/image RLS, public active policy, seller draft/pending policies, admin policies.
- `supabase/verification/0005_commerce_layer_isolation.sql`
  - Cross-buyer, seller order-line, draft hiding, other-seller-zero, admin visibility harness.
  - Notes current live data had admin/seller overlap, so seller tests need a non-admin seller probe.
- `supabase/verification/0008_seller_product_ownership_verify.sql`
  - Direct D5-4 ownership aid: FK, owner role counts, orphan `seller_id`, non-admin seller ACTIVE count, RLS enabled.

## 3. Seller Order Visibility

### Seller order pages

- `/seller/orders` -> `app/seller/orders/page.tsx`
  - `requireRole(["SELLER", "ADMIN"], "/seller/orders")`.
  - Uses `getSellerOrderLines()`.
  - Shows backend-not-ready if commerce tables missing.
  - Shows no demo/placeholder orders.
  - Shows line snapshots only: no buyer name, contact, address, order total, courier, ETA, pickup, or tracking claims.
- `/seller` -> `app/seller/page.tsx`
  - Still renders demo `SellerOrderTable`; do not use as real seller order proof.

### Seller order helpers

- `lib/orders/read-seller-orders.ts`
  - First reads current user's owned product ids via `products.seller_id = user.id`.
  - Then reads `order_items` with `.in("product_id", productIds)`.
  - RLS remains the real gate; helper filter prevents buyer/seller role overlap from showing purchased non-owned lines.
  - Handles missing tables as `backendReady: false`.
- `components/seller/seller-order-table.tsx`
  - Demo provider order table; includes buyer demo name. Not the real seller order surface.
- `components/seller/seller-orders-panel.tsx`
  - Demo/provider panel.

### Order item relationship

- Current commerce schema:
  - `order_items.order_id -> orders.id`
  - `order_items.product_id -> products.id`
  - `order_items.product_variant_id -> product_variants.id`
  - No `order_items.seller_id` column in current Supabase commerce migration.
- Seller ownership is derived at read time:
  - `order_items.product_id -> products.id`
  - `products.seller_id = auth.uid()`
  - parent order must be past `DRAFT` / `PAYMENT_PENDING`.
- Order item rows store immutable snapshots: product slug, title, brand, selected size/color, unit price paise, quantity, line total paise.

### Admin-only assumptions

- Admin product route: `/admin/products` requires `ADMIN`, then reads `getAdminProductsForReview()`.
- Admin sellers route: `/admin/sellers` is demo/local seller application review, not live seller ownership.
- Existing verification notes warn that if a product owner is also `ADMIN`, seller checks can exercise admin policies instead of seller-only policies.
- QA must use a non-admin `SELLER` account to prove seller isolation.

## 4. Test Routes

- `/seller`
  - Expected: protected by middleware as seller/admin.
  - Current surface is mixed/demo; useful for copy audit, not proof of live product ownership.
- `/seller/products`
  - Main live test for seller-owned products.
  - Must show only rows where `products.seller_id = current user id`.
- `/seller/orders`
  - Main live test for seller-owned order lines.
  - Must show only post-payment line snapshots for owned products.
- `/admin/products`
  - Admin-only live moderation queue for seller products.
  - Relevant for admin-owned product leakage and status transitions.
- `/admin/sellers`
  - Admin-gated demo seller application queue.
  - Relevant only to avoid confusing seller application state with product ownership.

## 5. Smoke Checklist

- Seller with no products:
  - Sign in as non-admin seller with zero `products.seller_id`.
  - `/seller/products` shows the empty state.
  - `/seller/orders` shows no order lines.
- Seller with owned products:
  - Product row has `seller_id = seller auth uid`.
  - `/seller/products` shows that product.
  - New product submission lands as `PENDING_REVIEW`, not `ACTIVE`.
- Seller cannot see non-owned products:
  - Sign in as seller B.
  - Product owned by seller A must not appear in `/seller/products`.
  - Use `0008_seller_product_ownership_verify.sql` A2/A5 to confirm owner roles.
- Seller orders show only owned product items:
  - Paid order with seller-owned product appears in `/seller/orders`.
  - Paid order with non-owned product does not appear.
  - Draft/payment-pending order line does not appear.
  - Seller still cannot read parent `orders` row directly.
- Admin-owned live products do not leak into seller dashboard:
  - If `ACTIVE` products are owned by an `ADMIN` user, a normal seller must not see them on `/seller/products`.
  - Do not count admin-owned ACTIVE products as proof of real seller-live inventory.
- No fake seller-live claims:
  - Avoid copy implying payouts, courier pickup, seller verification, live production seller accounts, or guaranteed visibility unless backed by real systems.
  - `/seller/orders` must not show buyer PII or fake logistics.
- `tsc` clean:
  - Run `npx.cmd tsc --noEmit`.

## Key Risks To Watch

- `/seller` is still demo-heavy while `/seller/products`, `/seller/dashboard`, and `/seller/orders` are live-aware.
- Admin-created products through seller create flow become admin-owned because `seller_id = user.id`.
- Admin/seller identity overlap can produce false seller isolation results.
- Missing local `0002_catalog_layer.sql` makes the migration chain hard to audit from this worktree alone.
- Legacy Prisma `seller_profile_id` should not be mixed into current Supabase RLS assumptions.
