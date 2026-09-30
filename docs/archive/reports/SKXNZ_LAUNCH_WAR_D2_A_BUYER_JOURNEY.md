# SKXNZ Launch War — Day 2 / D2-A: Full Buyer Purchase Journey Hardening

Date: 11 July 2026 · Branch: `launch-war-july30` · Author: Claude (D2-A slice)

## 1. Start / final branch + HEAD

- Starting branch: `launch-war-july30` at HEAD `a9177bf` (`chore(launch): prepare day 1 codex review pack`) — verified.
- Tracked tree clean at start; only the four pre-existing unrelated untracked files present
  (`AGENTS.md`, `docs/SKXNZ_D2_5_CONTROL_PACK.md`, `docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`,
  `docs/SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md`) — preserved, untouched, not committed.
- Claude's D1-A commit (`5cc7229`) is in history under Codex's D1-B commits (`cbdd9c3`, `c30f68e`, `a9177bf`).
- Final HEAD: see §3 (this slice's commit on the same branch).

## 2. Root gap found

The buyer journey's biggest correctness hole was **variant identity was never propagated**:

- `mapCatalogProductToBuyerProduct` collapsed live variant rows into flat `sizes[]`/`colors[]`
  string arrays and dropped the per-variant `id`.
- `addToCart` hardcoded `productVariantId: null` for every cart line.
- So `PlaceDraftOrder` always sent `variantId: null` to `createOrderIntent`, which then skipped
  the stock check and stored `selected_size = null` — the buyer's chosen size was silently lost
  on the created order, and out-of-stock variant selections were never rejected at the server.

The server action was otherwise already server-authoritative (D4-3): buyer from session, prices
re-fetched from DB, payment fields never written, DRAFT-only. The fix threads real variant ids
through the journey and hardens the server so it is the boundary regardless of the client.

## 3. Product / cart / checkout / order fixes

**Variant plumbing (product → cart → server):**
- `src/data/demo-products.ts`: new `ProductVariantOption` type + optional `Product.variants`
  (id/size/color/priceInr/stock/isActive). Demo products leave it undefined and keep working.
- `lib/catalog/mappers.ts`: live mapper now populates `variants` from real `product_variants` rows.
- `components/buyer/product-purchase-panel.tsx`: resolves the selected size+color to a real
  variant id; per-variant stock drives the stock label, the out-of-stock/disabled state, and an
  "option unavailable" state; passes `variantId` to `addToCart`. Demo-branch MVP copy removed.
- `components/marketplace/marketplace-provider.tsx`: `addToCart` accepts + stores `variantId`;
  rejects malformed quantity (whole 1–9) and, for variant-backed live products, requires a valid
  active in-stock variant before adding; `moveWishlistItemToCart` resolves the first in-stock
  active variant so wishlist→cart carries a real variant id; demo-only "browser-local MVP" cart
  message removed.

**Server hardening (`lib/orders/create-order-intent.ts`):**
- Fetches **all active variants by `product_id`** (not just client-supplied ids). New rule: if a
  product has active variants, the order **must** name a valid, in-stock one — a stale/forged
  client that omits the variant id is now rejected (`PRODUCT_UNAVAILABLE`) instead of creating a
  variant-less, stock-unchecked line. A foreign/inactive variant id is absent from the active set
  → rejected. Stock checked against the real variant row.
- Accidental-duplicate guard (§6b, best-effort, no schema change): if the buyer already created a
  DRAFT with the same subtotal AND the same line count in the last 60s, the existing order id is
  returned instead of inserting a near-identical twin. Documented as a double-click/navigation
  guard, not a cryptographic idempotency key (a dedicated key is a later hardening step).
- Existing guarantees confirmed unchanged: buyer from session; prices/titles from DB; quantity
  validation (integer 1–10, ≤50 lines) rejects zero/negative/decimal/excessive/malformed; payment
  fields never written; status `DRAFT` only; `redirectTo = /orders/<real id>`.

**Honesty (buyer-commerce surfaces only):**
- `product-detail-shell.tsx`: not-found + loading + size-guide + AI-preview copy de-MVP'd.
- `product-purchase-panel.tsx`: stock labels + demo-checkout line de-MVP'd.
- No unrelated pages redesigned.

## 4. Same-order guarantee (success / list / detail)

`createOrderIntent` returns `redirectTo = /orders/<id>` for the inserted (or deduped) row.
`/orders` (`getBuyerOrders`) and `/orders/[id]` (`getBuyerOrderById`) both read that same real
row by the session buyer, RLS-scoped. A regression test asserts `redirectTo` matches the inserted
id, and the dedupe test asserts it routes to the pre-existing order. No fake success page, no
invented order id, no PAID state anywhere.

## 5. Security boundaries verified

- Buyer identity: session-only (`auth.getUser()`); never from client/params.
- Price/title/variant/stock/status: all re-fetched server-side; client price/total/payment ignored.
- Variant availability + stock enforced server-side even if the client omits/forges the variant id.
- Quantity bounds enforced server-side (integer 1–10).
- Address must be the buyer's own row (`user_id` guard + RLS).
- Payment boundary intact: DRAFT only; no Razorpay; `payment_provider`/`payment_reference` never
  written; no fake payment success.
- Cross-buyer order access returns zero rows → `notFound()` (no existence leak) — unchanged, still true.

## 6. Tests + exact results

Extended `tests/commerce-actions.test.cjs` (Node `node:test`, mocked `@/lib/supabase/server`;
app-layer, no faked DB integration). Added D2-A coverage: inactive product, variant-backed with
no variant selected, foreign/invalid variant id, zero/negative/decimal/excessive/string/NaN
quantity, missing address, unowned address, DB variant price wins over client price, accidental
duplicate returns existing order, safe success routing. Mock builder gained `gte/lte/gt/lt`.

| Command | Result |
|---|---|
| `pnpm run test:commerce` | **34 tests, 34 pass, 0 fail** |
| `pnpm exec tsc --noEmit --incremental false` | **EXIT 0** |
| `pnpm exec eslint <changed app files + eslint.config.mjs>` | **clean** (`tests/**` added to eslint ignores — Node CJS harness, not app source) |
| `git diff --check` | clean (only LF→CRLF warnings) |
| secret scan (`service_role\|sk_live_\|rzp_live_\|eyJhbGciOi…`) over changed dirs | no matches |
| honesty scan (`MVP\|mock\|demo checkout\|browser-local`) over buyer-commerce surfaces | no matches |
| Browser smoke | see §7 |
| Production build | not run — dev-machine build uses the slow WASM-SWC workaround; `tsc` + lint + tests gate this slice, and `main`/app config is untouched |

## 7. Browser smoke

Dev server (seed/demo catalog — live Supabase unreachable from this machine, so the live-variant
path is covered by unit tests, not the browser):
- `/shop` renders product cards; product links resolve to `/product/<slug>` (verified 4 links).
- `/product/obsidian-signal-oversized-tee` renders; multi-size product correctly gates the CTA at
  "SELECT A SIZE" (disabled) until a size is chosen, then enables "ADD TO CART".
- Add to cart writes one cart line (size "S", qty 1) and shows the de-MVP'd "…was added to your
  cart" feedback. No "MVP" text on the page; no horizontal overflow; no console errors.

## 8. Remaining blockers for Codex D2-B

1. Live authenticated checkout end-to-end (create a real DRAFT with a variant, confirm on
   `/orders/[id]`, confirm stock/variant snapshot) — not runnable here (Supabase unreachable from
   this dev machine, standing `TypeError: fetch failed`).
2. Duplicate-order guard is a 60s heuristic, not a DB idempotency key — a concurrent double-submit
   in the same tick can still race. A real idempotency key / unique constraint is the hardening step.
3. Cart shows the device-local snapshot price; the order re-prices from DB at creation. If the
   catalog price changed, the created order's subtotal can differ from the cart estimate. This is
   honest (nothing is paid; order detail shows the real price) but a "price changed since you added
   this" cart reconciliation notice would be a nicer UX (D2-B).
4. Legacy demo (non-live) products still carry some review/draft edge-case copy in rarely-shown
   error states; a full demo-component deletion sweep remains open (carried from D1-A).
5. Variant-level UI still selects size and color independently; a product whose variants pair
   specific size+color combos could show a selectable pair with no matching variant — the panel
   marks it "option unavailable" and the server rejects it, but a combined variant selector is a
   D2-B UX improvement.

## 9. Confirmation

- No push. No deployment. No live SQL executed. No secrets added or exposed. No new migrations.
- The four pre-existing unrelated untracked files were preserved and are not part of the commit.
