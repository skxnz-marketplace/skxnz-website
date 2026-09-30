# SKXNZ Launch War — Day 1 / D1-A: Buyer Commerce + Returns + Support Completion

Date: 10 July 2026 · Branch: `launch-war-july30` · Author: Claude (D1-A slice)

## 1. Starting state

- Starting branch: `day3-cart-order-flow` at HEAD `cdb445a` (expected baseline confirmed).
- Tracked working tree clean; only the four pre-existing unrelated untracked files present
  (`AGENTS.md`, `docs/SKXNZ_D2_5_CONTROL_PACK.md`, `docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`,
  `docs/SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md`) — all preserved, untouched, uncommitted.
- Created and worked on new branch `launch-war-july30` from `cdb445a`.

## 2. Current state found (verification, Part A)

`createOrderIntent` (`lib/orders/create-order-intent.ts`, D4-3/D4-8) was read line-by-line and
verified — NOT rewritten. It already:

- authenticates the buyer via `supabase.auth.getUser()` (session only, never client input);
- re-fetches product (must be `ACTIVE`), variant (must belong to product + `is_active`), and
  checks `stock_quantity` server-side;
- computes unit price (`variant.price_inr ?? product.price_inr` × 100 → integer paise), line
  totals, and subtotal entirely from DB values — no client price/total is read;
- rejects client control of payment state: input carries only product/variant ids, quantity,
  address id, note. `status` is hardcoded `'DRAFT'`; payment fields are never written (also
  blocked by the 0005 RLS insert policy requiring NULL payment fields + DRAFT/PAYMENT_PENDING);
- creates a real `orders` row + `order_items` rows with title/slug/brand/image/size/colour/price
  snapshots + contact/shipping snapshots re-fetched from the buyer's own `public.addresses` row;
- handles partial-write risk: documented sequential-insert limitation; a failure after the order
  row leaves a harmless empty unpaid DRAFT (buyers have no UPDATE/DELETE grant). Single-RPC
  atomicity remains a flagged future hardening step (operator dependency, not new);
- returns a stable result contract (`ok` union with codes `UNAUTHENTICATED | VALIDATION_FAILED |
  ADDRESS_REQUIRED | PRODUCT_UNAVAILABLE | OUT_OF_STOCK | NOT_WIRED | DB_ERROR`);
- duplicate submission guarded in the calling UI (`PlaceDraftOrder`: `useTransition` +
  disabled button + early return);
- redirects to the real order page (`/orders/<id>`);
- can never mark PAID: `→PAID` is reserved for the future signature-verified webhook; the admin
  transition action explicitly forbids it; RLS forbids buyer updates entirely.

Verdict: order persistence complete and correct. Effort focused on returns/support per brief.
One contract fix applied: `createSupportTicket` success `redirectTo` pointed at `/support`
(now the public info page) — corrected to `/account/support/<ticketId>`.

## 3. Return flow work (Part B)

Already present from D4-5/D5-3: DELIVERED-only eligibility, ownership re-check, item-to-order
matching, per-line quantity cap, honest disabled states, `/account/returns` status list.

New hardening this slice:

- **Cross-request netting** in `lib/returns/create-return-request.ts`: before insert, the buyer's
  earlier return requests for the same order are re-read; every **non-REJECTED** request's item
  quantities are subtracted from what is still claimable per line. Fully-claimed line →
  new code `ALREADY_REQUESTED`; over-remainder → `QUANTITY_EXCEEDED`. REJECTED frees quantity;
  all other statuses (incl. CLOSED) conservatively keep their claim. Concurrent double-submit
  race remains until the future single-RPC step (documented in-file); admin review is backstop.
- **New `getOrderReturnSummary(orderId)`** in `lib/returns/read-return-requests.ts`: per-order,
  buyer-owned, non-REJECTED requests + claimed quantities per order item (UX truth only; the
  action re-checks on submit).
- **`OrderReturnPanel`** (order detail): shows existing return requests with human status labels
  and dates; caps the quantity selector at the remaining returnable quantity ("N still
  returnable"); hides fully-claimed lines; when everything is claimed shows an honest
  "A return is already in progress" card instead of the form. Submit quantities clamped
  client-side too.

Still true: no delivered orders exist live yet (no payment provider), so end-to-end return
creation stays unreachable in production data — the flow rejects honestly (`NOT_ELIGIBLE`).

## 4. Support flow work (Part C)

Already present from D4-5/D5-3/D5-3B and verified, not rewritten: ticket creation with optional
owned-order link, category/subject/message validation, buyer ticket list, ticket thread page,
reply on active tickets only, honest closed-ticket notice, timestamps, status badges. Ownership
checks: session-derived buyer id, order link re-fetched with `buyer_id` filter, ticket re-fetched
before reply, RLS as the real gate. Fix applied: success `redirectTo` now
`/account/support/<ticketId>`.

## 5. Public routes rewritten (Part E)

- **`app/support/page.tsx`** — was a `"use client"` demo intake writing tickets to
  browser-local marketplace-provider state, with "Demo Buyer" defaults, "MVP Support Intake"
  wording, and stale claims ("Real authentication is not connected yet"). Now a server-component
  info page: truthful support-area cards, primary CTA into the real authenticated workflow at
  `/account/support` (sign-in requirement stated), guidance to open order-linked tickets from
  `/orders`, FAQ link. No form, no localStorage, no response-time promise ("every ticket is read
  and answered by a person" — matches the existing product copy; no SLA invented).
- **`app/returns/page.tsx`** — was "Returns Draft / internal review" copy plus the
  `DemoRoleGate`-wrapped `ReturnRequestWorkspace` demo. Now a clean policy/information page:
  how a return actually works today (delivered order → request → human review → no automatic
  refund/pickup), truthful expectations list, notice that the full published policy is being
  finalized before launch, CTAs to `/orders`, `/account/returns`, `/support`. No demo components,
  no demo-role dependency. Useful policy substance (no-overpromise statements) preserved in
  updated language.
- Demo components (`ReturnRequestWorkspace`, marketplace-provider ticket store, `DemoRoleGate`)
  remain on disk but are no longer imported by these routes (repo-established pattern).
- **`middleware.ts`** — `/returns` removed from the auth-gated prefix list: it is now a public
  policy page (the old gate existed only for the demo workspace). The real buyer return
  surfaces stay server-gated under `/account/*` and `/orders/*`. Browser-verified: `/returns`
  serves publicly; `/account/returns` still redirects unauthenticated to `/login`.

## 6. Security and ownership controls

- Buyer identity: session-only everywhere (`auth.getUser()`); no buyer/user id from client.
- Orders/items/tickets/returns: app-level ownership filters + live-verified 0005/0006 RLS
  (D4-7 isolation harness ran on the live DB — all blocks PASS).
- Missing/foreign order or ticket → zero rows → not-found paths; no existence leak.
- Payment state unforgeable from buyer input (test-asserted; see §8 test 10).
- No `service_role` in any buyer-facing file touched; secret scan clean.
- Order references shown as 8-char short codes; raw uuids not surfaced as copy.

## 7. Routes and files changed

- `app/support/page.tsx` — rewritten (demo intake → real-workflow info page)
- `app/returns/page.tsx` — rewritten (draft/demo → policy page routing to real flow)
- `middleware.ts` — `/returns` ungated (public policy page; real flows stay gated)
- `app/orders/[id]/page.tsx` — fetches `getOrderReturnSummary`, passes to return panel
- `components/orders/order-return-panel.tsx` — existing-return awareness, remaining-qty caps
- `lib/returns/create-return-request.ts` — cross-request netting + `ALREADY_REQUESTED`
- `lib/returns/read-return-requests.ts` — `getOrderReturnSummary`
- `lib/support/create-support-ticket.ts` — `redirectTo` fix
- `tests/` — new zero-dependency test harness (see §8)
- `package.json` — `test:commerce` script
- `.gitignore` — `tests/.build/`
- `PROGRESS.md`, this report

## 8. Tests and commands run (exact results)

New test infrastructure (no new dependencies — npm registry unreachable from this machine, so
nothing could be installed; plain `node:test` + `tsc` used instead):

- `tests/tsconfig.json` compiles the four real server actions to `tests/.build`.
- `tests/bootstrap.cjs` resolves the `@/*` alias and swaps `@/lib/supabase/server` for a mock.
- `tests/mocks/supabase-server.cjs` + `tests/helpers/mock-supabase.cjs` — scripted chainable
  query-builder double; tests run the REAL action logic against scripted rows.
- `tests/commerce-actions.test.cjs` — 19 tests covering the Part G list: unauthenticated
  rejection (all four actions), foreign-order return, foreign-item return, non-DELIVERED
  rejection, qty > purchased, qty > remainder-after-netting, full-duplicate `ALREADY_REQUESTED`,
  REJECTED-frees-quantity, foreign-ticket reply, closed-ticket reply, foreign-order ticket link,
  junk-order-id short-circuit (no DB call), valid ticket creation (OPEN + BUYER message
  payload asserted), valid return persistence payload (REQUESTED + own ids), forged payment
  fields ignored (DRAFT + DB paise pricing asserted, no payment fields in insert payload),
  out-of-stock variant rejection.
- These are application-layer tests with a mocked client — explicitly NOT database integration
  tests. Live-DB RLS enforcement is separately proven by
  `supabase/verification/0005_commerce_layer_isolation.sql` (operator-run in D4-7, all PASS).
  No database test result is faked.

Results:

| Command | Result |
|---|---|
| `pnpm run test:commerce` | 19 tests, 19 pass, 0 fail |
| `pnpm exec tsc --noEmit --incremental false` | EXIT 0, zero errors |
| `pnpm exec eslint <changed areas>` | EXIT 0 |
| secret scan (`service_role\|sk_live_\|rzp_live_\|eyJhbGciOi…`) over changed dirs | no matches |
| `git status --short` | only intended files + the four preserved untracked files |
| Browser smoke (public pages) | `/support` and `/returns` render the new content, desktop + 375px mobile, no console errors, no horizontal overflow, no demo/MVP copy from these routes; `/account/returns` still redirects unauthenticated to `/login?next=%2Faccount%2Freturns`. Authenticated pages cannot render locally (standing Supabase-unreachable blocker) |
| Production build | not run — dev-machine builds use the WASM-SWC workaround and take very long; `tsc` + lint + tests gate this slice, and `main` is not being touched |

## 9. Draft migrations / operator dependencies

- **No new migration created or required** this slice. All flows run on applied 0005/0006.
- Pre-existing operator TODOs unchanged: `0007_buyer_saved_items.sql` still unapplied
  (wishlist sync, unrelated to this slice); single-RPC atomicity for order/return/ticket
  creation remains a future hardening migration (documented, not blocking).

## 10. Remaining issues for Codex D1-B

1. Live browser smoke of authenticated surfaces (`/orders/[id]` return panel with a DELIVERED
   test order, `/account/support` create + thread + reply) — impossible from this machine
   (standing `TypeError: fetch failed` to Supabase since D3-5).
2. Concurrent double-submit race on return requests (app-level netting only) — closes with the
   single-RPC hardening step.
3. No admin/support console yet (`/admin/support`, `/admin/returns`) — buyer tickets currently
   have no staff-reply path (D5-4B backlog).
4. Return-eligibility remains status-based (DELIVERED) with no time window — a published return
   window needs a business decision before launch.
5. `/faq` page content should get the same honesty sweep as `/support` and `/returns`.
6. Old demo components still on disk (unrouted): `ReturnRequestWorkspace`, marketplace-provider
   ticket store, `DemoRoleGate`, `demo-checkout-*` — candidate for a deletion sweep.

## 11. Confirmation

- No push. No deployment. No live SQL executed. No secrets added or exposed.
- The four pre-existing unrelated untracked files were preserved and are not part of the commit.
