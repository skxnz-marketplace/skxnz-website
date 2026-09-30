# SKXNZ — Launch War D3-A — Seller Order Operations

## 1. Starting branch and HEAD
- Branch: `launch-war-july30`
- HEAD:   `6a38c04`

## 2. Current seller system found
- `/seller/orders` (D4-6) rendered a flat list of `order_items` for the seller's own products, post-payment only, via the 0006 SECURITY DEFINER RLS helper. No order-level grouping, no detail route, no fulfilment actions.
- Seller has no direct SELECT policy on `public.orders` (by design — buyer identity/address/totals never reach a seller). This is preserved.
- Seller lifecycle (0004): `products.status in ('DRAFT','PENDING_REVIEW')` write policy for `auth.uid() = seller_id`; role read from `public.users.role` via `requireRole(["SELLER","ADMIN"])`.
- Existing tests: 34 buyer-side (`pnpm run test:commerce`). No seller-side coverage.

## 3. Correct existing functionality preserved
- 0005 orders schema + RLS.
- 0006 seller-visibility helper.
- Buyer create/list/detail; buyer support/returns; admin queue + status action.
- No unrelated redesign; buyer surfaces untouched.
- Existing untracked files (`AGENTS.md`, three Day-2 docs) preserved — not staged.

## 4. Defects found
- `/seller/orders`: line-only view forced seller to reason across many card rows for a single order; no way to open one order and act on its lines.
- No seller order detail route.
- No seller fulfilment mutation surface — sellers could not accept, pack, or hand a line to delivery.
- Sidebar copy carried "Inventory Demo" / "Orders — track seeded order states" language, contradicting real live queue.
- `order_items` had no per-line seller fulfilment state; whole-order status is admin-owned by policy and would have been misused if any seller action touched it.

## 5. Seller order list implementation
- `lib/orders/read-seller-orders.ts` — new `getSellerOrders()` groups the seller's own post-payment lines by `order_id`, returning per-order line count, quantity total, seller-only subtotal (never merged with other sellers' lines or shipping/tax), earliest/latest line date, and the aggregate fulfilment step (earliest step wins so a PENDING line dominates a PACKED one on the same order).
- `app/seller/orders/page.tsx` — server component behind `requireRole(["SELLER","ADMIN"])`. Grouped cards. Honest empty state + backend-not-ready state. "Read-only view" banner when the 0009 fulfilment columns are absent. "Open order" link → `/seller/orders/<id>`.

## 6. Seller order detail implementation
- `lib/orders/read-seller-orders.ts` → new `getSellerOrderById(id)` returns only the seller's own lines on that order. Cross-seller / unrelated / unknown ids resolve to `order: null` → `notFound()` in the page (no existence leak).
- `app/seller/orders/[id]/page.tsx` — server component. Order header (short id, first-line time, seller's-lines total, unit/line count). Explicit copy stating buyer identity/address/payment/tracking are **not** in seller scope. Per-line card renders brand/title snapshot, size/colour/qty, unit + line paise, fulfilment status + note, last-updated timestamp, and the fulfilment action panel when 0009 is applied.
- Uses only order_items snapshots + own product ids. `public.orders` is never queried in this route.

## 7. Seller fulfilment actions
- Draft migration `supabase/migrations/0009_seller_line_fulfilment.sql` (NOT APPLIED) adds `order_items.seller_fulfilment_status` (default `PENDING`, check `PENDING|ACCEPTED|PACKED|HANDED_TO_DELIVERY`), `seller_fulfilment_note`, `seller_fulfilment_updated_at`, plus `public.order_item_events` (append-only per-line audit). RLS: seller SELECTs events via the 0006 helper; buyer SELECTs events via order ownership; admin manages all; anon/authenticated get no INSERT — writes go through service-role.
- Verification `supabase/verification/0009_seller_line_fulfilment_verify.sql` checks columns/types/defaults, check constraint values, index, RLS on `order_item_events`, exact grant surface, and asserts no new UPDATE/DELETE grant on `order_items` for anon/authenticated.
- `lib/orders/seller-update-line-fulfilment.ts` — `"use server"` action. Session identity → `public.users.role in ('SELLER','ADMIN')` gate → seller-scoped SELECT of the target line via the 0006 helper → defensive re-ownership via `products.seller_id = auth.uid()` (skipped for ADMIN) → forward-only ladder validation (`PENDING→ACCEPTED→PACKED→HANDED_TO_DELIVERY`; `ADD_NOTE` keeps status) → conditional `UPDATE ... WHERE seller_fulfilment_status = <expected>` via `supabaseAdmin` (authenticated has no UPDATE grant) → best-effort `order_item_events` INSERT (from/to status, actor_user_id). Result codes: `UNAUTHENTICATED | FORBIDDEN | VALIDATION_FAILED | LINE_NOT_FOUND | INVALID_TRANSITION | NOT_WIRED | DB_ERROR`.
- Missing table (42P01) OR missing column (42703) → `NOT_WIRED` (no write). UI hides action buttons and shows "Read-only view" banner in that state.
- Never touches `public.orders`. Never writes `payment_provider`, `payment_reference`, or whole-order status. Never touches another seller's line.

## 8. Ownership and privacy controls
- Route gate: `requireRole(["SELLER","ADMIN"])` on both `/seller/orders` and `/seller/orders/[id]`.
- Read gate: seller RLS ("order_items: seller can select own product lines" via `public.seller_owns_post_payment_order_line`). Sellers cannot SELECT any `public.orders` row → buyer identity/address/contact/totals never rendered to a seller.
- Write gate: authenticated has NO UPDATE on `order_items` (0005). Only the action's service-role write can touch fulfilment columns, and only after the role check + product-ownership recheck.
- No `service_role` reads anywhere in the seller surfaces.
- Cross-seller order id → 0 rows → `notFound()` (no existence leak; matches buyer detail pattern).

## 9. Inventory/stock truth
- Seller detail truthfully shows ordered qty and selected size/colour from the immutable `order_items` snapshot.
- Fulfilment actions do NOT decrement stock (no atomic RPC exists in this slice; the pre-checkout `create-order-intent.ts` stock check already fires against `product_variants.stock_quantity`).
- Reservation is intentionally NOT implemented — surfaces stay honest; no fake decrement.
- Documented gap: seller-visible "active return request" indicator is out of scope for D3-A because `return_requests` RLS gives sellers zero read access; broadening this needs a new policy + operator sign-off.

## 10. Draft migrations created but not applied
- `supabase/migrations/0009_seller_line_fulfilment.sql`
- `supabase/verification/0009_seller_line_fulfilment_verify.sql`
- Neither applied. Operator apply steps (Supabase Dashboard → SQL Editor):
  1. Paste `0009_seller_line_fulfilment.sql`, run once (idempotent).
  2. Paste `0009_seller_line_fulfilment_verify.sql`, compare each result to its EXPECT comment.
  3. Optional: exercise `updateSellerLineFulfilment` from the app once a real non-admin SELLER owns a product on a PAID order and confirm one `order_items` row transitions and one `order_item_events` row is inserted.

## 11. Tests and exact results
- `pnpm run test:commerce` — **49 / 49 pass** (34 pre-existing + 15 new D3-A). New coverage:
  1. Unauthenticated seller list returns empty backend-ready.
  2. Unauthenticated fulfilment action → `UNAUTHENTICATED`.
  3. BUYER role fulfilment action → `FORBIDDEN`.
  4. Seller A with no owned products → empty queue.
  5. Seller RLS-invisible line → `LINE_NOT_FOUND`.
  6. Product owned by another seller → `LINE_NOT_FOUND` via defensive recheck.
  7. `→PAID` rejected `VALIDATION_FAILED`.
  8. `→REFUNDED` rejected `VALIDATION_FAILED`.
  9. Skipped step (PENDING→PACKED) rejected `INVALID_TRANSITION`.
  10. Backwards step (PACKED→ACCEPTED) rejected `INVALID_TRANSITION`.
  11. Repeat of same status rejected `INVALID_TRANSITION`.
  12. Junk uuid → `LINE_NOT_FOUND`, zero DB calls made.
  13. Valid PENDING→ACCEPTED writes conditional service-role UPDATE + audit event (asserted).
  14. Grouped list sums seller-only totals and picks earliest aggregate status.
  15. Detail lookup for an unrelated order id → null (no existence leak).
- `pnpm exec tsc --noEmit --incremental false` — EXIT 0.
- `pnpm exec eslint "app/seller/**/*.tsx" "components/seller/**/*.tsx" "lib/orders/**/*.ts"` — EXIT 0.
- `git diff --check` — EXIT 0 (only CRLF line-ending warnings).
- Secret scan on `app/seller components/seller lib/orders` — clean (no `service_role`/`sk_live_`/`rzp_live_` in source; `supabaseAdmin` used server-only in the action file which is `"use server"`).

## 12. Runtime checks and limitations
- Dev server started (`preview_start` → port 3001); `/seller/orders` compiled cleanly and correctly middleware-redirected an unauthenticated visitor to `/login?next=%2Fseller%2Forders` (200). Route wiring proven.
- Authenticated live browser exercise is blocked by the standing `TypeError: fetch failed` on this dev machine — the Supabase project is unreachable from here (same blocker documented since D3-5). Operator runtime QA checklist:
  1. Apply `0009_seller_line_fulfilment.sql`. Run `0009_seller_line_fulfilment_verify.sql`; compare against EXPECTs.
  2. Sign in as a real non-admin `SELLER` that owns at least one ACTIVE product on a PAID order. Load `/seller/orders` → expect a grouped card for that order; open detail → expect only the seller's own lines and no buyer info.
  3. Click **Mark Accepted — preparing** on a PENDING line → expect success chip; refresh → line shows ACCEPTED. Repeat for PACKED and HANDED_TO_DELIVERY.
  4. Try clicking a status button twice quickly → the second call receives `INVALID_TRANSITION` (conditional UPDATE catches the race).
  5. Sign in as another SELLER whose products are on a different order → `/seller/orders` shows zero rows; opening the first seller's order id in the URL → 404.
  6. Sign in as a BUYER → any direct request to `/seller/orders/*` hits `requireRole` and redirects to `/`.
  7. Sign in as ADMIN → sees every seller's orders (ADMIN retains broader access).

## 13. Remaining issues for Codex D3-B
- Apply `0009_seller_line_fulfilment.sql` live and re-run the isolation harness (extend it with two seller identities to prove that seller A never sees `order_item_events` for seller B's line).
- Seller-facing "active return request" indicator (requires a scoped SELECT policy on `return_requests` / `return_request_items` for sellers; broadening not attempted here).
- Wire per-line events into the buyer order detail as a public timeline (optional).
- Reconsider whether "Handed to delivery" should also flip whole-order status → `SHIPPED` when every line is HANDED_TO_DELIVERY (needs single-order-multi-seller policy decision).
- Migrate the seller fulfilment write to a single Postgres RPC for atomic UPDATE + audit INSERT.
- Delete unrouted legacy demo seller components (`seller-order-table.tsx`, `seller-orders-panel.tsx`) after confirming no import remains.

## 14. Files changed
- `supabase/migrations/0009_seller_line_fulfilment.sql` (new, DRAFT)
- `supabase/verification/0009_seller_line_fulfilment_verify.sql` (new)
- `lib/orders/read-seller-orders.ts` (rewrite — grouped list + detail, fulfilment-column detection)
- `lib/orders/seller-update-line-fulfilment.ts` (new)
- `app/seller/orders/page.tsx` (grouped queue + banners)
- `app/seller/orders/[id]/page.tsx` (new)
- `components/seller/seller-line-actions.tsx` (new)
- `lib/data/site-content.ts` (sidebar copy fix)
- `tests/mocks/supabase-admin.cjs` (new)
- `tests/bootstrap.cjs` (admin-mock resolution)
- `tests/tsconfig.json` (include new sources)
- `tests/commerce-actions.test.cjs` (+15 seller tests)
- `docs/SKXNZ_LAUNCH_WAR_D3_A_SELLER_ORDER_OPERATIONS.md` (this file)
- `PROGRESS.md` (D3-A entry)

## 15. Confirmation
- **No push** performed.
- **No deployment** performed.
- **No live SQL** applied — 0009 remains a draft file.
- **No secrets added** — service-role used only in the existing `lib/supabase/admin.ts` module imported by the server-only action file.
- **Unrelated untracked files preserved** — `AGENTS.md`, `docs/SKXNZ_D2_5_CONTROL_PACK.md`, `docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`, `docs/SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md` were not staged, not modified.
