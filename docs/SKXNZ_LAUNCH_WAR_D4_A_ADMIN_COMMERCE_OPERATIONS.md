# SKXNZ — Launch War D4-A — Admin Commerce Operations

## 1. Starting branch and HEAD
- Branch: `launch-war-july30`
- HEAD:   `f8c05dc` (task sheet expected `524052d` — that commit does not exist in this repo and no Codex D3-B commit had landed; actual state was recorded and work continued safely from `f8c05dc` with a clean tracked tree).

## 2. Current admin systems found
- `/admin/orders` + `/admin/orders/[id]` (D4-6): real list/detail + `order_events` audit, `adminUpdateOrderStatus` action existing but **unwired to any UI**.
- `/admin/returns` + `/admin/returns/[id]`, `/admin/support` + `/admin/support/[id]` (D1-B): real reads via admin RLS; transition/reply actions existed (`adminUpdateReturnStatus`, `adminUpdateSupportTicketStatus`, `adminAddSupportReply`) but **no UI controls called them**; pages were minified single-line stubs with raw enums, full-uuid noise, mojibake (`Â·`), no uuid guards (junk ids hit Postgres), and no queue styling.
- Admin nav copy claimed "Order management placeholder" / "refund placeholder" — stale.
- No operations overview existed.

## 3. Correct functionality preserved
- `adminUpdateOrderStatus` transition map (now shared via `lib/orders/admin-order-transitions.ts`, no behavior change; `→PAID` / `→REFUNDED` remain unreachable).
- Admin RLS read-path pattern (session client, no service-role reads).
- All buyer/seller surfaces and D3-A seller fulfilment layer untouched.
- 4 unrelated untracked files preserved.

## 4. Defects found
1. Order status action unwired to UI. 2. Return/support detail pages had zero action controls. 3. No ops overview. 4. Raw enum + uuid noise; mojibake in returns list. 5. No uuid-shape guards on admin return/support reads/actions (junk id → Postgres 22P02). 6. Return action had no audit note, no stable error contract, no conditional-update conflict detection response shape. 7. Stale/false nav copy. 8. Unused demo components `admin-orders-panel.tsx` / `admin-returns-panel.tsx` still on disk (rendered "Refund Placeholder" copy).

## 5. Admin operations overview
- New `lib/orders/read-admin-operations.ts` → `getAdminOperationsSummary()`: real count queries (orders PAID/FULFILLING, total orders, returns REQUESTED/IN_REVIEW, tickets OPEN/IN_REVIEW/WAITING_FOR_CUSTOMER, PENDING seller lines when 0009 is applied — `null` = unknown, never invented) + 8 most recent `order_events`.
- New `/admin/operations` page: four tiles linking into existing queues, recent-events feed with per-event order links, honest backend-not-ready and fulfilment-not-enabled states. **No revenue figures** — totals are NULL pre-live-checkout, so no safe derivation exists.
- Sidebar gained an "Operations" link; stale placeholder copy on Orders/Returns/Support links fixed.

## 6. Order operations
- `/admin/orders/[id]` gained an "Order status actions" card wired to `adminUpdateOrderStatus` via new `components/admin/admin-order-status-panel.tsx`: only offers transitions from the shared map, CANCELLED requires an explicit confirm step, optional audit note (≤500), terminal states explained ("Paid and Refunded come only from a signature-verified payment webhook / provider-confirmed refund").
- Action now `revalidatePath`s the admin order routes on success. Conditional `.eq("status", current)` conflict behavior unchanged.

## 7. Return operations
- `adminUpdateReturnStatus` hardened: uuid guard, optional audit note into the `order_events` message + metadata, conditional update with explicit conflict result, stable result contract (`VALIDATION_FAILED | FORBIDDEN | REQUEST_NOT_FOUND | INVALID_TRANSITION | NOT_WIRED | DB_ERROR`). Transitions unchanged: `REQUESTED→IN_REVIEW|REJECTED`, `IN_REVIEW→APPROVED|REJECTED`. Refund/pickup/received states unreachable.
- `read-admin-return-requests.ts` rewritten: typed shapes, uuid guard, and item rows now join `order_items` snapshots (title/size/colour/purchased qty) so admins see "Returning 1 of 2 purchased" instead of a bare uuid.
- `/admin/returns` + `/admin/returns/[id]` rebuilt on `DashboardShell`: status chips with clean labels ("Approved — refund not executed"), items card, review-actions card via new `components/admin/admin-return-actions.tsx` (reject requires confirm), link to the parent admin order, honest copy that approval moves no money.

## 8. Support operations
- `admin-support-actions.ts` hardened: uuid guards, stable result contracts, conditional status update, explicit closed-ticket message. Reply attribution unchanged and server-controlled (`sender_role='ADMIN'`, `sender_id` = session user).
- `/admin/support` + `/admin/support/[id]` rebuilt on `DashboardShell`: queue with subject/category/priority/linked-order/last-activity + status chips; detail with full thread (sender-labelled bubbles), reply form + validated status buttons via new `components/admin/admin-support-panel.tsx`, link to the linked admin order. Copy states no email/notification/SLA automation exists.

## 9. Seller fulfilment visibility
- `getAdminOrderById` extended (42703-aware): items carry `sellerId` (via `products.seller_id`), `fulfilmentStatus/Note/UpdatedAt` (0009 columns; falls back to legacy column set pre-migration with `fulfilmentReady:false`), plus `lineEvents` from `order_item_events` and `returnRequests` for the order.
- `/admin/orders/[id]` renders per-line seller short-code + fulfilment label ("Awaiting seller action" etc.), seller notes, a read-only "Seller fulfilment history" card, and a "Return requests on this order" card linking into `/admin/returns/[id]`.
- **No admin override of seller-line state was invented** — visibility is read-only; the page says so explicitly.

## 10. Privacy/security controls
- Every admin route: `requireRole(["ADMIN"])` + admin RLS; every mutation re-verifies ADMIN from `public.users.role` server-side before any service-role write.
- Buyer/seller uuids masked to 8-char short codes in all new/updated UI; no auth internals, tokens, or payment credentials rendered; payment fields shown only as provider/reference presence ("No payment record — no provider is connected").
- Junk ids short-circuit before any DB call (uuid-shape guards) — no existence leak, no Postgres errors.
- All enums formatted to clean labels; mojibake removed.

## 11. Draft migrations/RPCs created but not applied
- **None new this slice.** 0009 (`seller_line_fulfilment`) remains the outstanding draft from D3-A; all D4-A code detects its absence (42703/42P01) and degrades truthfully (`fulfilmentReady:false`, pending-line count `null`, read-only banners). Atomic status+audit in one transaction remains a documented single-RPC hardening item for later (conditional updates + best-effort audit inserts cover the current risk envelope).

## 12. Tests and exact results
- `pnpm run test:commerce` — **69 / 69 pass** (49 prior + 20 new D4-A):
  unauth/buyer/seller blocked from admin order mutation; `→PAID` and `→REFUNDED` unreachable; skipped transition rejected; concurrent/repeated transition conflicts; valid PAID→FULFILLING asserts conditional UPDATE + audit metadata (from/to/actor); buyer blocked from return mutation; `→REFUNDED` unreachable on returns; skip (REQUESTED→APPROVED) rejected; junk return id short-circuits with zero DB calls; valid REQUESTED→IN_REVIEW asserts audit note; buyer cannot forge admin reply; admin reply attribution asserted server-controlled; reply to CLOSED rejected; CLOSED→OPEN rejected; seller blocked from ticket status; `getAdminOrderById` junk id → null with zero DB calls; missing 0009 columns → truthful `fulfilmentReady:false`.
- `pnpm exec tsc --noEmit --incremental false` — EXIT 0.
- ESLint over `app/admin`, `components/admin`, `lib/orders`, `lib/returns`, `lib/support` — 0 errors (1 pre-existing unused-var warning in untouched `lib/returns/return-requests.ts`).
- `git diff --check` — clean (CRLF warnings only). Secret scan — clean. Honesty scan on D4-A surfaces — only honest-negative copy and the `DemoRoleGate` component name.
- Test infra: new `tests/mocks/next-stubs.cjs` (revalidatePath/redirect stubs — the real ones need a Next request context), bootstrap maps `next/cache`/`next/navigation` to it; tsconfig includes the four admin modules.

## 13. Runtime limitations
- Dev server route smoke: `/admin/operations`, `/admin/orders`, `/admin/returns`, `/admin/support` each 307 → `/login?next=…` → 200 for an unauthenticated visitor (middleware gate proven; no compile errors).
- Authenticated live render blocked — standing `TypeError: fetch failed` (Supabase unreachable from this dev machine). Production build not attempted (known WASM-SWC environment limitation, not a code defect).
- **Operator QA checklist:** (1) sign in as ADMIN → `/admin/operations` shows real counts; (2) open an order → status panel offers only legal transitions, DRAFT order offers only "Cancel order…" with confirm; (3) move a PAID order → FULFILLING → check one `order_events` row with actor id; (4) double-click a transition → second attempt reports conflict; (5) open a return → Start review → Approve → audit events on the order, no refund claim anywhere; (6) reply on an open ticket → buyer sees it at `/account/support/[id]` attributed to SKXNZ Admin; (7) sign in as BUYER/SELLER → all `/admin/*` routes redirect away; (8) after 0009 is applied, order detail shows real per-line fulfilment states + history and `/admin/operations` shows the pending-line count instead of "—".

## 14. Remaining items for Codex D4-B
- Apply 0009 live; re-run isolation harness; verify admin line-event visibility live.
- Single-RPC atomic status+audit writes (orders, returns).
- Order list search/filter by status (indexed field) if queue volume warrants.
- Buyer-facing surfacing of admin return decisions (currently visible via `/account/returns` status only).
- Optional WAITING/reopen policy design for support; email/notification integration is intentionally absent.
- Remaining old demo admin panels outside commerce scope (`admin-overview-panel`, `admin-users-table`, `community-moderation-table`, `content-control-panel`, `admin-analytics-panel`) still power non-commerce routes — out of D4-A scope.

## 15. Files changed
- `app/admin/operations/page.tsx` (new)
- `app/admin/orders/[id]/page.tsx` (status panel, seller fulfilment visibility, returns + line-event cards)
- `app/admin/returns/page.tsx`, `app/admin/returns/[id]/page.tsx` (rebuilt)
- `app/admin/support/page.tsx`, `app/admin/support/[id]/page.tsx` (rebuilt)
- `components/admin/admin-order-status-panel.tsx`, `admin-return-actions.tsx`, `admin-support-panel.tsx` (new)
- `components/admin/admin-orders-panel.tsx`, `admin-returns-panel.tsx` (deleted — proven unused)
- `lib/orders/admin-order-transitions.ts` (new), `lib/orders/read-admin-operations.ts` (new)
- `lib/orders/admin-update-order-status.ts` (shared map + revalidate), `lib/orders/read-admin-orders.ts` (extended)
- `lib/returns/admin-update-return-status.ts`, `lib/returns/read-admin-return-requests.ts` (rewritten)
- `lib/support/admin-support-actions.ts`, `lib/support/read-admin-support-tickets.ts` (rewritten)
- `lib/data/site-content.ts` (admin nav)
- `tests/mocks/next-stubs.cjs` (new), `tests/bootstrap.cjs`, `tests/tsconfig.json`, `tests/commerce-actions.test.cjs` (+20 tests)
- `docs/SKXNZ_LAUNCH_WAR_D4_A_ADMIN_COMMERCE_OPERATIONS.md` (this file), `PROGRESS.md`

## 16. Confirmation
- **No push. No deployment. No live SQL. No secrets added** (service-role used only inside existing `"use server"` action files via `lib/supabase/admin.ts`). **Unrelated untracked files preserved.**
