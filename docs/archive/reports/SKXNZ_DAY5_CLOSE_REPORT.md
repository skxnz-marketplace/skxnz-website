# SKXNZ Day 5 — Close Report

**Date:** 2026-07-09
**Final branch:** `day3-cart-order-flow`
**Status:** Day 5 complete. Not pushed, no PR, no deploy.

---

## Day 5 Objective

Turn the Day 4 commerce/backend foundation into real, honest buyer- and
seller-facing account surfaces:
- make wishlist / save-for-later work with live Supabase products
- make the account address book agree with checkout's real address table
- expose buyer support tickets + return requests (create, thread, reply, list)
- verify seller product ownership is genuinely seller-scoped

All under the standing rules: no push, no auto-applied SQL, no service_role in
client code, session-derived user id only, RLS enforces ownership, no fake
payment/delivery/refund/pickup/resolution claims.

---

## Day 5 Commits (all on `day3-cart-order-flow`)

| Hash | Slice | Summary |
|------|-------|---------|
| `553074b` | D5-1 | wishlist live product snapshots + `saved_items` backend draft |
| `6ff1e9e` | D5-2 | account address book wired to real `public.addresses` table |
| `30c8990` | D5-3 | buyer support ticket + return request create surfaces |
| `75c62a6` | D5-3B/D5-4A | buyer support ticket thread + reply + returns list |
| `881d2eb` | D5-4 | seller ownership verification + honest live-table copy |

(Day 4 boundary: `22d53cd chore(progress): close day 4 commerce backend sprint`.)

---

## What Shipped

**Buyer wishlist (D5-1)**
- Wishlist stores full product **snapshots** (like the cart), so live Supabase
  products no longer vanish from saves. `normalizeStoredWishlist()` migrates
  legacy id-string arrays. Save-for-later works for live items.
- Account-synced saves server layer (`lib/saved/*`) + `saved_items` backend
  **draft** (0007, unapplied) with owner RLS.

**Address ↔ checkout (D5-2)**
- New `lib/data/address-actions.ts` (`create/update/delete/setDefault`,
  India-ready validation, session user only). `getBuyerAddressBook()` +
  `address-book-live.tsx` client. `/account/addresses` now writes the SAME
  `public.addresses` table checkout reads — the old device-local demo gap is
  closed. `/checkout` gained "add/manage addresses" links.

**Support + returns (D5-3, D5-3B/D5-4A)**
- Create: `/account/support` (BuyerSupportForm → real `createSupportTicket`);
  `OrderReturnPanel` on `/orders/[id]` (DELIVERED-gated → real
  `createReturnRequest`).
- Thread: `/account/support/[id]` reads one owned ticket + messages, reply via
  real `addSupportTicketMessage` (active tickets only); ticket list rows link to
  it.
- List: `/account/returns` via new `getBuyerReturnRequests()`.
- Account nav gained Returns + Support; account overview gained Contact Support
  + My Returns.

**Seller ownership (D5-4)**
- Verified `products.seller_id → users(id)` model + RLS is already correct and
  strictly seller-scoped (reads/create/orders all session-scoped). Added
  read-first verification SQL. Fixed a false "creation not connected" copy line.

---

## Migrations / Verification Files Added (Day 5)

| File | Type | Applied? |
|------|------|----------|
| `supabase/migrations/0007_buyer_saved_items.sql` | migration DRAFT | **NO** |
| `supabase/verification/0007_buyer_saved_items_verify.sql` | verification | **NO** |
| `supabase/verification/0008_seller_product_ownership_verify.sql` | verification (read-first + OPERATOR OPTIONAL) | **NO** |

Live schema used by D5 surfaces (support/returns/addresses/orders) is
`0005_commerce_layer.sql` + `0006_fix_seller_order_item_rls.sql` + `0001`
addresses — all applied and verified in Day 4.

## SQL NOT Applied (operator TODO)

- `supabase/migrations/0007_buyer_saved_items.sql`
- `supabase/verification/0007_buyer_saved_items_verify.sql`
- `supabase/verification/0008_seller_product_ownership_verify.sql`

None run by Claude. 0007 is the only unapplied **migration**; 0008 is read-only
verification, safe to run anytime.

---

## Surface Status

**Buyer wishlist:** device-local live snapshots working (verified at compile /
device level). Account-sync (`saved_items`) code ready but **blocked until 0007
applied**; click-to-sync + device→account merge on login still deferred.

**Address / checkout:** account book and checkout now share
`public.addresses`. Live schema applied. Logged-in CRUD not browser-verified
(Supabase unreachable from dev machine).

**Support / returns:** create + thread + reply + list all wired to real 0005
tables (applied). Fully functional in code. **No delivered orders exist yet**
(needs payment + fulfilment), so a return cannot be created end-to-end today —
the DELIVERED gate is intentional and honest. No admin/support console to author
staff replies yet.

**Seller ownership:** model correct + seller-scoped. Live products currently
owned by an **ADMIN** account (`info@skxnz.com`) — real non-admin seller
ownership is a data step (Add Product as a SELLER, or 0008 Section B), not a
code fix.

---

## Checks Run

- `git status` — clean except 4 pre-existing unrelated untracked files + the
  Codex QA doc (all intentionally excluded from D5 commits).
- `git log --oneline -8` — 5 D5 commits present, in order.
- `npx tsc --noEmit` → **EXIT 0** (zero errors).
- Secret grep (`service_role|sk_live_|rzp_live_`) over all D5 touched dirs
  (`app/{account,seller,orders}`, `components/{support,orders,account,seller,checkout}`,
  `lib/{support,returns,saved,data,orders,catalog}`, `supabase/verification`) →
  only two **comment** hits ("No service_role…"), no real usage.

---

## Known Blockers / Standing Limitations

1. **Supabase unreachable from dev machine** (standing `TypeError: fetch failed`)
   — every D5 logged-in surface is compile/route/typecheck-verified only;
   operator must run one live browser pass.
2. **0007 saved_items unapplied** — account-synced wishlist inert until applied.
3. **No paid/delivered orders** — returns not creatable end-to-end; seller order
   queue empty until real buyer purchases exist (needs Razorpay + fulfilment).
4. **Live products admin-owned** — needs a real non-admin SELLER to own a live
   product (operator via Add Product or 0008 Section B).
5. **No admin/support/returns author console** — buyers can open/reply/list; staff
   side (reply as SUPPORT, move return lifecycle) is a later slice (D5-4B).
6. **Razorpay + delivery not started** — deliberately untouched all of Day 5.

---

## Recommended Next Move

**Option A — Push/merge/deploy checkpoint (lower risk to ship, needs a smoke first)**
- Branch is `tsc`-clean, secret-clean, honest-copy. Before any push: operator
  runs ONE live browser pass on a Supabase-reachable machine (sign in; check
  `/account/addresses` CRUD, `/account/support` + thread reply, `/account/returns`,
  `/account/wishlist`), applies 0007 if account-sync wishlist is wanted, and runs
  0008 Section A. Then push `day3-cart-order-flow` and open a PR to `main`.

**Option B — D6 launch-readiness sprint before push (recommended)**
- Close the honesty/functionality gaps that make the marketplace demoable
  end-to-end: (1) apply 0007 + wire wishlist click-to-sync + login merge;
  (2) create one real non-admin seller-owned ACTIVE product; (3) admin/support
  console (D5-4B) so tickets/returns have a staff side; (4) begin Razorpay draft
  (server-authoritative order → payment) so an order can actually reach
  DELIVERED and exercise returns. Then push a stronger checkpoint.

**Suggestion:** Option B. Current D5 work is correct but several surfaces cannot
be exercised end-to-end (no payment, no delivered order, live products
admin-owned). A short D6 makes the whole loop real before the first push.
