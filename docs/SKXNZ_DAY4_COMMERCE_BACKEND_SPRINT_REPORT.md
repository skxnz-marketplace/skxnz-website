# SKXNZ — Day 4 Commerce Backend Sprint Report

**Branch:** `day3-cart-order-flow`
**Scope:** internal commerce backend (orders, order items, events, returns, support, seller/admin queues) + live Supabase apply + checkout draft-order wiring.
**Hard boundaries held:** no Razorpay/Cashfree/gateway, no Shiprocket/Delhivery/courier, no fake payment success, no fake delivered/tracking/ETA, no fake refund, no demo/placeholder orders, no PAID status set anywhere by client.

---

## What shipped (commit trail)

| Commit | Slice | Summary |
|--------|-------|---------|
| `03bb192` | D4-1 | Prepare internal commerce backend (draft migration + input types) |
| `9e450b5` | D4-2 | Verify/harden commerce DB layer (grants bug fix, integrity checks, RLS hardening, idempotent migration, verification SQL) |
| `d857cd2` | D4-3 | `createOrderIntent` server action — server-authoritative price/product/address, DRAFT-only |
| `561de12` | D4-4 | Buyer order history `/orders` + detail `/orders/[id]` (RLS-scoped, honest empty/unpaid states) |
| `5fdafde` | D4-5 | Returns + support server actions (own DELIVERED orders only; OPEN tickets; buyer-only replies) |
| `7bf6c70` | D4-6 | Seller + admin internal order queues (`/seller/orders`, `/admin/orders`, `/admin/orders/[id]`, `adminUpdateOrderStatus`) |
| `d8a4f6f` | D4-7 prep | Preflight + isolation SQL harness |
| `12078e7` → `73b9ac3` | D4-7 | Live apply, verification, RLS isolation harness fixes, real seller-RLS bug fix (`0006`) |
| `7931cbb` | D4-7 | Record live commerce verification + app smoke (code-level) |
| `7839efe` | D4-8 | Checkout creates a real **unpaid DRAFT** order via `createOrderIntent` |

---

## What was applied live (Supabase SQL Editor, operator-run)

- `supabase/migrations/0005_commerce_layer.sql` — applied. 7 tables: `orders`, `order_items`, `order_events`, `support_tickets`, `support_ticket_messages`, `return_requests`, `return_request_items`. Integer-paise money, status/category check constraints, `set_updated_at` triggers, FKs, RLS on all 7, admin via `public.is_admin()`, `anon` zero-grant, `authenticated` select/insert only.
- `supabase/migrations/0006_fix_seller_order_item_rls.sql` — applied. Adds SECURITY DEFINER helper `public.seller_owns_post_payment_order_line(order_id, product_id)` and repoints the seller `order_items` SELECT policy at it (fixes a real bug — see below).

## What was verified

- `supabase/verification/0005_commerce_layer_preflight.sql` — ID types + dependencies passed pre-apply.
- `supabase/verification/0005_commerce_layer_verify.sql` — compact verification **PASS**: 7 tables, RLS on all 7, 21 policies, 3 triggers, `dangerous_authenticated_update_delete_grants = 0`.
- `supabase/verification/0005_commerce_layer_isolation.sql` — RLS isolation harness, final run **no FAIL rows**:
  - anon denied on all commerce tables;
  - buyer sees only own orders; cross-buyer read/insert blocked; no PAID/payment-field insert; no buyer UPDATE→PAID;
  - seller sees only own product lines on post-payment orders (never DRAFT, never the orders row, never another seller's lines);
  - admin sees all.
- Code-level app smoke (routes wired, gates present, 42P01 branches dead post-0005, `tsc --noEmit` clean).

---

## Known warnings / risks

1. **`CONFIG-admin-seller-overlap-detected: WARN`** — the current live product owner (`info@skxnz.com`, `31e9e3aa…`) also has role ADMIN. The isolation harness works around this with a temporary non-admin seller probe, but real seller-only behaviour in production should be re-confirmed once a genuine non-admin SELLER owns live products.
2. **Live browser smoke not yet run** — this dev machine cannot reach live Supabase (`TypeError: fetch failed`), so the order routes and the new checkout draft-order flow were verified at code/typecheck level only. Operator visual confirmation still needed (steps below).
3. **`adminUpdateOrderStatus` non-admin rejection** (`FORBIDDEN`) is only testable from the app, not from SQL (it uses the service-role client after an app-level role check).
4. **Atomicity** — `createOrderIntent` / returns / support inserts run in sequence (no client-side transaction). A mid-sequence failure leaves a harmless empty unpaid DRAFT (no refund/approval implied). Single-RPC hardening is a future step.

## Operator smoke steps still needed (Supabase-reachable machine)

1. Sign in as a buyer with ≥1 saved address in `public.addresses`.
2. Add one ACTIVE product (in-stock variant) to cart.
3. `/checkout` → pick address under "Create draft order" → **Create Draft Order**.
4. Expect redirect to `/orders/<id>` showing "Draft — not paid".
5. Confirm in Supabase: one `orders` row `status = 'DRAFT'`, matching `order_items` in integer paise; `/orders` lists it; cart still populated.
6. As a SELLER who owns a product on a post-payment order, confirm `/seller/orders` shows only their own lines.
7. As ADMIN, confirm `/admin/orders` + `/admin/orders/[id]` list real orders + `order_events`; a non-admin call to `adminUpdateOrderStatus` returns `{ ok: false, code: 'FORBIDDEN' }`.

---

## Day 5 priority (next)

**Wire the wishlist to accept live product snapshots** so "Save For Later" round-trips real cart items (current `## Next up` item 1). Backend-first stance continues — still no Razorpay/delivery/refund until explicitly scheduled.

## Push status

Branch `day3-cart-order-flow` is **not pushed** (per standing rule: no push without operator approval). Working tree is clean apart from intentionally-untracked project docs and tool scratch (`.agents/`, `.codex/` now gitignored; `AGENTS.md` + three Day-2 docs left untracked for the operator to decide).
