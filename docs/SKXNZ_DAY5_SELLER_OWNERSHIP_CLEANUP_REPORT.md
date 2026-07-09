# SKXNZ Day 5 — D5-4 Seller Product Ownership Cleanup Report

Branch: `day3-cart-order-flow`
Date: 2026-07-09
Session: D5-4

---

## What Existed Before

Seller surfaces already read live Supabase products, but nobody had verified
*whose* products they are. The live/seeded products are owned by
`info@skxnz.com`, whose role is **ADMIN** (the D4-7 `CONFIG-admin-seller-overlap`
WARN). No tooling existed to confirm or fix that.

Files inspected:
- `app/seller/products/page.tsx` → `getSellerProductsWithRelations()`
- `app/seller/dashboard/page.tsx` → same helper + metric cards
- `app/seller/orders/page.tsx` → `getSellerOrderLines()`
- `app/seller/products/new/actions.ts` → `createSellerProduct`
- `lib/catalog/queries.ts` → seller/admin/active product readers
- `lib/orders/read-seller-orders.ts`
- `components/seller/seller-product-table.tsx`
- Migrations `0004_seller_product_lifecycle.sql`, `0005_commerce_layer.sql`, `0006_fix_seller_order_item_rls.sql` (products/`seller_id` + RLS). `0002_catalog_layer` (products table + seller_id) is applied live but its file is not in this repo.

---

## Ownership Model Found (exact)

| Fact | Evidence |
|------|----------|
| Product → seller link | `public.products.seller_id uuid` → `public.users(id)` |
| Seller write RLS | `0004`: `"products: seller can insert own draft or pending"` / `"...update own draft or pending"` — `auth.uid() = seller_id AND status in ('DRAFT','PENDING_REVIEW')` |
| Admin write RLS | `public.is_admin()` manages all |
| Seller product read | `getSellerProductsWithRelations()` filters `.eq("seller_id", user.id)` (session user only) |
| Create ownership | `createSellerProduct` inserts `seller_id: user.id` from `supabase.auth.getUser()` — never client input; forces `status: 'PENDING_REVIEW'` |
| Seller order read | `getSellerOrderLines()` resolves own product ids then filters `order_items` + D4-2/0006 seller RLS (post-payment only; sellers cannot read `orders`) |

**Conclusion:** the ownership model in code + RLS is already correct and
strictly seller-scoped. There was **no code bug** where admin-owned products
leak as another seller's, and no seller surface reads all products. The gap is
**operational/data**: the live products' `seller_id` currently points at an
ADMIN account, and there was no verification tool. Live products are therefore
**admin-owned**, not yet owned by a real non-admin SELLER.

---

## Files Changed

### New
| File | Description |
|------|-------------|
| `supabase/verification/0008_seller_product_ownership_verify.sql` | READ-FIRST ownership checks (Section A, pure SELECT); OPERATOR OPTIONAL reassignment steps (Section B, fully commented, not run) |
| `docs/SKXNZ_DAY5_SELLER_OWNERSHIP_CLEANUP_REPORT.md` | this report |

### Modified
| File | Change |
|------|--------|
| `components/seller/seller-product-table.tsx` | Live-mode subtitle corrected — creation IS wired (Add Product page); approval is via admin review. Old copy falsely said "creation is not connected here yet." |
| `PROGRESS.md` | D5-4 log + Next up |

No changes to buyer checkout/payment/delivery. No Razorpay/delivery touched. No UI redesign.

---

## SQL / Operator Steps Needed

**No new migration.** Ownership schema + RLS already exist and are applied live
(0002/0004/0005/0006). This slice adds a **verification-only** SQL file:

- **Section A (safe, run this):** confirms the `seller_id` FK, breaks down
  products per owner *with owner role*, flags orphan (`seller_id IS NULL`)
  products, counts non-admin SELLER-owned ACTIVE products, lists SELLER-role
  users, and confirms RLS on. Read-only.
- **Section B (OPERATOR OPTIONAL, commented out):** exact reversible steps to
  promote an existing user to SELLER and reassign one existing product to them
  for a real seller-owned test. Never auto-runs; creates no fake brand/product;
  guarded against downgrading an admin; includes rollback lines.

**Not applied by Claude.** Operator runs Section A in the Supabase SQL Editor.

---

## Seller Product Behaviour After Change

- `/seller/products` and `/seller/dashboard` still read **only** the session
  seller's own products (`seller_id = auth.uid()`). Unchanged, correct.
- Live-mode table copy now truthful: products are seller-owned; creation is on
  the Add Product page; approval status is set by admin review. No "creation not
  connected" falsehood.
- Empty state stays honest: "No seller-owned products were found in Supabase for
  this account yet."
- `/seller` landing still shows a clearly-labeled **demo** product table (device
  catalog) — untouched, already labeled "Demo product table" / beta.

## Seller Order Behaviour After Change

- Unchanged (already correct). `/seller/orders` shows only order lines for the
  seller's own products, post-payment only, via RLS + explicit product-id
  filter. No buyer identity/address/totals readable. Honest empty state: "Order
  lines appear here once buyers place real paid orders for your products."

---

## Operator Verification Steps

1. Supabase Dashboard → SQL Editor → paste **Section A** of
   `supabase/verification/0008_seller_product_ownership_verify.sql` → Run.
2. Read **A2**: if every product row shows `owner_role = ADMIN`, the catalog is
   admin-owned. **A4** `non_admin_seller_active_products` = 0 confirms no real
   seller owns a live product yet.
3. **A3** must return 0 rows (no orphan products). Any row = a real bug to fix.
4. To create a genuine seller-owned test product, either:
   - sign in as a real SELLER account and use `/seller/products/new` (Add
     Product) — cleanest, creates a `PENDING_REVIEW` product owned by that
     seller, then admin approves it to ACTIVE; **or**
   - run **Section B** (uncomment, fill the two uuids) to reassign an existing
     product to an existing non-admin user promoted to SELLER.
5. Re-run A2 + A4 to confirm `owner_role = SELLER` and the active count rose.

---

## Checks Run

- `npx tsc --noEmit` → EXIT 0.
- Secret grep (`service_role|sk_live_|rzp_live_`) over `app/seller`,
  `components/seller`, `lib/catalog`, `lib/orders`, `supabase/verification` → no
  matches (0008 uses no keys; it is read SQL + commented operator steps).
- `git status` — 4 pre-existing unrelated untracked files remain excluded.

---

## Known Limitations

1. **Live products still admin-owned** until the operator runs the Add Product
   flow as a real SELLER (or Section B). Code is ready; only data is unmigrated.
2. **No `/seller/products/[id]` edit route** exists — there is nothing to
   ownership-guard there yet. Seller edit is a later slice; when added it must
   re-check `seller_id = auth.uid()` server-side.
3. **`/seller` landing demo tables** remain device-local demo (labeled). Not
   converted to live this slice to avoid an unrelated redesign.
4. **Logged-in seller render not browser-verified** — Supabase unreachable from
   this dev machine (standing blocker). Typecheck + route wiring confirmed only.
5. **Seller onboarding/approval is still partial** — a `/sell` application exists
   but promotion to SELLER role is a manual/admin step; no self-serve seller
   activation. UI copy does not claim "seller fully live."

---

## Exact Next Task — D5 Final Checkpoint (D5-5)

**D5 closeout + honest seller/marketplace status pass.**
1. Operator runs `0008_seller_product_ownership_verify.sql` Section A and (if a
   real seller is wanted) creates one seller-owned ACTIVE product via Add
   Product + admin approve; record A2/A4 results.
2. Write `docs/SKXNZ_DAY5_SPRINT_REPORT.md` — commit trail D5-1→D5-4, what is
   live vs draft, what still needs operator action (0007 saved_items unapplied;
   seller ownership data; Razorpay/delivery not started).
3. Sweep remaining seller/account copy for any "fully live" overclaim; confirm
   every not-yet-wired surface states so honestly.
4. Confirm `main`-deployability and branch push-readiness (still no push without
   operator approval).
