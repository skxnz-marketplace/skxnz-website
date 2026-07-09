# SKXNZ D5-3 Support / Returns QA Playbook

Compact QA + route index for Claude's D5-3 work: buyer support and return request UI surfaces.

Related: [[SKXNZ_DAY4_COMMERCE_BACKEND_SPRINT_REPORT]], [[SKXNZ_QA_CHECKLIST]], [[SKXNZ_D5_1_WISHLIST_QA_PLAYBOOK]]

Tags: #skxnz/qa #skxnz/support #skxnz/returns #skxnz/day5

## Current findings

- Real backend action foundations already exist for support and returns in `lib/support/*` and `lib/returns/*`.
- Current D5-3 worktree includes a real buyer support surface at `/account/support`, plus an order-detail return panel on `/orders/[id]`.
- Public `/support` still exists as an older browser-local MVP/demo intake using `MarketplaceProvider`, not the real server action.
- Public `/returns` still exists as an older draft policy/demo returns workspace using browser-local marketplace state.
- `/orders` and `/orders/[id]` are real server-rendered buyer routes backed by session-scoped Supabase reads and RLS.
- Middleware protects `/orders`, `/returns`, `/wishlist`, `/account`, `/admin`, and `/seller`; logged-out users redirect to `/login?next=...`.
- `/support` is not protected by middleware today; `/account/support` is protected.
- No `/account/returns` route was found.
- Admin `/admin/support` and `/admin/returns` exist, but they are still demo/local UI surfaces and admin-gated.
- Return creation is intentionally conservative: server action allows returns only for buyer-owned `DELIVERED` orders and starts returns as `REQUESTED`.
- Support creation starts tickets as `OPEN`; opening message is `BUYER`; no staff/admin reply is invented.

## Routes/files discovered

### Buyer support routes

- `/account/support` -> `app/account/support/page.tsx`
  - Requires `requireUser("/account/support")`.
  - Reads buyer-owned support tickets via `getBuyerSupportTickets()`.
  - Accepts optional `?order=<uuid>` and passes it to `BuyerSupportForm`.
  - Shows honest backend-not-ready state when 0005 tables are missing.
- `/support` -> `app/support/page.tsx`
  - Older public support page.
  - Uses `useMarketplace().createSupportTicket()` and browser-local support tickets.
  - Useful as legacy comparison, but not the real D5-3 account support path.

### Buyer return routes

- `/orders` -> `app/orders/page.tsx`
  - Real buyer order list from `getBuyerOrders()`.
  - Shows only real DB orders for the session buyer.
  - Empty state uses `OrderReadinessPanel`; missing backend shows explicit "not connected yet".
- `/orders/[id]` -> `app/orders/[id]/page.tsx`
  - Real buyer order detail from `getBuyerOrderById(id)`.
  - Cross-buyer or missing order returns `notFound()`.
  - Renders `OrderReturnPanel` and links to `/account/support?order=<id>`.
- `/returns` -> `app/returns/page.tsx`
  - Older draft returns policy/demo workspace.
  - Protected by middleware because path starts `/returns`.
  - Uses `ReturnRequestWorkspace` and browser-local marketplace returns, not the real D4-5 server action.
- `/account/returns`
  - Not found.

### Account/admin routes

- `/account` -> `app/account/page.tsx`
  - Real auth/account diagnostics page.
  - Worktree includes a link to `/account/support`.
- `/account/orders` -> `app/account/orders/page.tsx`
  - Honest no-demo-orders account shell route; still uses `OrderReadinessPanel`.
- `/login` -> `app/login/page.tsx`
  - Required for logged-out redirects.
- `/admin/support` -> `app/admin/support/page.tsx`
  - Admin-gated demo/local support queue from `MarketplaceProvider.supportTickets`.
- `/admin/returns` -> `app/admin/returns/page.tsx`
  - Admin-gated demo return management surface via `AdminReturnsPanel`.
- `/admin/orders` and `/admin/orders/[id]`
  - Admin order routes exist and should not be regressed by buyer support/returns UI.

### Support/returns components

- `components/support/buyer-support-form.tsx`
  - Client form wired to real `createSupportTicket()`.
  - Category values come from `supportTicketCategories`.
  - No fake instant resolution; successful ticket is shown as open and human-reviewed.
- `components/orders/order-return-panel.tsx`
  - Client panel wired to real `createReturnRequest()`.
  - Only enables return form when order status is `DELIVERED`.
  - Disabled copy for unpaid/cancelled/refunded/not-delivered states.
- `components/returns/return-request-workspace.tsx`
  - Older local/demo returns workspace.
- `components/support/support-card.tsx`, `components/support/contact-form-demo.tsx`, `components/support/faq-accordion.tsx`
  - Support content/demo components.

### Server actions and helpers

- `lib/support/create-support-ticket.ts`
  - Creates `support_tickets` + opening `support_ticket_messages`.
  - Buyer id from session only.
  - Optional order id must belong to the buyer.
  - Missing 0005 tables return `NOT_WIRED`.
- `lib/support/add-support-ticket-message.ts`
  - Appends one buyer reply to buyer-owned active tickets.
  - Reply allowed only for `OPEN`, `WAITING_FOR_CUSTOMER`, `IN_REVIEW`.
- `lib/support/read-support-tickets.ts`
  - Reads authenticated buyer's own `support_tickets`.
  - Returns `backendReady: false` on missing 0005 tables.
- `lib/support/support-requests.ts`
  - Support categories/statuses and input validation.
- `lib/returns/create-return-request.ts`
  - Creates `return_requests` + `return_request_items`.
  - Buyer id from session only.
  - Order must be buyer-owned and `DELIVERED`.
  - Order items must belong to the same order; quantity must not exceed purchased line quantity.
  - Missing 0005 tables return `NOT_WIRED`.
- `lib/returns/return-requests.ts`
  - Return statuses and input validation.
- `lib/orders/read-buyer-orders.ts`
  - Buyer order list/detail read helper.
  - Exports `isOrderIdShape()` for UUID guard.
  - Cross-buyer rows are filtered by RLS and explicit `buyer_id`.
- `lib/orders/read-admin-orders.ts`, `lib/orders/read-seller-orders.ts`
  - Admin/seller order helpers exist; avoid regressions.

## Schema/data availability

Primary schema file: `supabase/migrations/0005_commerce_layer.sql`.

Support tables:

- `support_tickets`
  - Fields: `id`, `buyer_id`, `order_id`, `category`, `status`, `subject`, `priority`, `created_at`, `updated_at`.
  - Categories: `ORDER`, `RETURN`, `PAYMENT`, `DELIVERY`, `PRODUCT`, `ACCOUNT`, `OTHER`.
  - Statuses: `OPEN`, `WAITING_FOR_CUSTOMER`, `IN_REVIEW`, `RESOLVED`, `CLOSED`.
  - Priority: `LOW`, `NORMAL`, `HIGH`, `URGENT`.
  - Indexes: `support_tickets_buyer_id_idx`, `support_tickets_order_id_idx`.
  - Trigger: `support_tickets_set_updated_at`.
- `support_ticket_messages`
  - Fields: `id`, `ticket_id`, `sender_id`, `sender_role`, `message`, `metadata`, `created_at`.
  - Sender roles: `BUYER`, `SUPPORT`, `ADMIN`, `SYSTEM`.
  - Index: `support_ticket_messages_ticket_id_idx`.

Return tables:

- `return_requests`
  - Fields: `id`, `order_id`, `buyer_id`, `status`, `reason`, `note`, `created_at`, `updated_at`.
  - Statuses: `REQUESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PICKUP_PENDING`, `RECEIVED`, `REFUND_PENDING`, `REFUNDED`, `CLOSED`.
  - `REFUNDED` is documented as server-side only after real provider-confirmed refund.
  - Indexes: `return_requests_order_id_idx`, `return_requests_buyer_id_idx`.
  - Trigger: `return_requests_set_updated_at`.
- `return_request_items`
  - Fields: `id`, `return_request_id`, `order_item_id`, `quantity`, `reason`, `created_at`.
  - Constraint: `quantity > 0`.
  - Quantity not exceeding ordered quantity is enforced by server action, not a DB check.
  - Indexes: `return_request_items_request_id_idx`, `return_request_items_order_item_id_idx`.

RLS/grant hints:

- RLS enabled on `orders`, `order_items`, `order_events`, `support_tickets`, `support_ticket_messages`, `return_requests`, `return_request_items`.
- `anon` gets no commerce table grants.
- `authenticated` gets select/insert on support and return tables; no update/delete grants.
- `support_tickets` buyer insert requires `auth.uid() = buyer_id`, status `OPEN`, and any attached order must be buyer-owned.
- `support_ticket_messages` buyer insert requires `sender_role = BUYER` and ticket status in `OPEN`, `WAITING_FOR_CUSTOMER`, `IN_REVIEW`.
- `return_requests` buyer insert requires buyer-owned `DELIVERED` order and status `REQUESTED`.
- `return_request_items` buyer insert requires the item to belong to the same order as the return request.
- Admin policies use `public.is_admin()`.

Verification files:

- `supabase/verification/0005_commerce_layer_verify.sql`
  - Checks 7 tables, RLS, policy counts, grants, constraints, FKs, indexes, triggers.
- `supabase/verification/0005_commerce_layer_isolation.sql`
  - Cross-buyer and seller visibility isolation harness.
- `supabase/verification/0005_commerce_layer_preflight.sql`
  - Preflight for 0005 apply/readiness.

## Smoke checklist

- Logged-out support/returns redirect:
  - Open `/account/support` logged out -> expect `/login?next=/account/support`.
  - Open `/returns` logged out -> expect `/login?next=/returns`.
  - Open `/orders` logged out -> expect `/login?next=/orders`.
  - Note: `/support` is currently public legacy/demo support, so it should not be used as the auth-gated support test.
- Logged-in empty support state:
  - Sign in as buyer.
  - Open `/account/support`.
  - If 0005 is not applied, see backend-not-ready copy.
  - If 0005 is applied and no tickets exist, see empty "no support tickets" state.
- Create support ticket:
  - On `/account/support`, choose category, enter subject/message.
  - Submit.
  - Confirm success says ticket is open / human-reviewed.
  - Refresh; if backend is applied, ticket appears in "Your tickets".
- Create support ticket from order detail:
  - Open a real owned order at `/orders/[id]`.
  - Click "Contact Support About This Order".
  - Confirm `/account/support?order=<id>` opens and shows linked order reference.
  - Submit ticket and confirm it stores/reads with the order id.
- Create return request from order detail:
  - Open an owned order with status `DELIVERED`.
  - Select one or more order items.
  - Enter return reason.
  - Submit.
  - Confirm copy says review request only; no refund/pickup is promised.
- Missing order disabled/not-found state:
  - Open `/orders/not-a-uuid` -> should not query Postgres; expect not-found.
  - Open `/orders/<random-valid-uuid>` -> expect not-found if no owned order.
  - `/account/support?order=not-a-uuid` should ignore bad default order id.
- Non-owned order blocked:
  - As buyer B, open buyer A order id at `/orders/<id>` -> not-found.
  - As buyer B, submit support with buyer A order id -> action returns "That order could not be found."
  - As buyer B, submit return for buyer A order id -> action returns order not found.
- No fake refund/delivery/pickup claims:
  - Unpaid/draft orders must say no payment has been taken.
  - Non-delivered orders must show return unavailable.
  - Return success must not say refund approved, pickup scheduled, courier assigned, or delivery date exists.
  - Support success must not say resolved, replied by staff, or email/CRM notified unless actually built.
- No console errors:
  - Test `/orders`, `/orders/[id]`, `/account/support`, `/returns`, `/support`.
  - Watch browser console and dev server logs.
- TypeScript:
  - Run `npx.cmd tsc --noEmit`.

## Risks to watch

- `/account/support` exists but `AccountShell` nav may not include a Support tab yet.
- `/account/support` uses real server action while `/support` remains legacy local/demo; QA should not confuse the two.
- `/returns` remains legacy local/demo while `OrderReturnPanel` is the real server-action surface.
- 0005 may not be applied in Supabase; UI must show `NOT_WIRED` / backend-not-ready honestly.
- Supabase-js action inserts are not atomic: support ticket can exist without opening message if second insert fails; return request can exist without items if item insert fails.
- Return cross-request over-return is not DB-enforced yet; server action checks against purchased line quantity only.
- `DELIVERED` orders may not exist yet; return form will usually be disabled until admin/order status flow creates one.
- Do not expose order existence across buyers; use not-found/generic "could not be found".
- Do not introduce client-side buyer_id/order ownership trust.
- Do not add refund, pickup, courier, delivery ETA, payment success, or staff reply claims unless backed by real provider/server state.

## What Claude should not break

- Middleware redirects for `/orders`, `/returns`, `/account/support`, and `/account`.
- `/orders` real buyer-owned list with backend-not-ready and empty states.
- `/orders/[id]` real buyer-owned detail, UUID guard, and cross-buyer not-found behavior.
- Existing unpaid honesty copy for `DRAFT` and `PAYMENT_PENDING`.
- `createSupportTicket()`, `addSupportTicketMessage()`, and `createReturnRequest()` ownership checks.
- `NOT_WIRED` handling for missing 0005 tables.
- RLS assumptions: no anon access, no buyer update/delete, no client-set paid/refunded states.
- Public `/support` and `/returns` pages should not claim real live operations unless they are fully rewired.
- Admin support/returns pages should remain admin-gated.
- Checkout/cart/order-readiness routes should still typecheck and render.
