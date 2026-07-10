# SKXNZ D1 Current Commerce Map

Baseline: `launch-war-july30` at `5cc722905e3ba095e0ab762af7e3515c08eb2e3b`.

This map describes the verified local source only. It does not claim future Claude work exists.

## Repository Baseline

- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR client.
- Package manager: `pnpm` via `pnpm-lock.yaml` and `packageManager: pnpm@10.33.0`.
- Core scripts: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test:commerce`, optional `pnpm run build`.
- Current action tests: `tests/commerce-actions.test.cjs`, compiled through `tests/tsconfig.json`, using `node:test` and mocked `@/lib/supabase/server`.
- Drift to review: several commerce file comments still say migration `0005` is not applied live, while `PROGRESS.md` says D4-7 applied it.

## Route Map

Buyer/account routes:

- `app/checkout/page.tsx`
- `app/orders/page.tsx`
- `app/orders/[id]/page.tsx`
- `app/account/orders/page.tsx`
- `app/account/returns/page.tsx`
- `app/account/support/page.tsx`
- `app/account/support/[id]/page.tsx`
- `app/support/page.tsx` public info page
- `app/returns/page.tsx` public policy page

Seller routes:

- `app/seller/orders/page.tsx`
- Product ownership remains rooted in `public.products.seller_id`.

Admin routes:

- `app/admin/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`
- `app/admin/support/page.tsx`
- `app/admin/returns/page.tsx`

Protection:

- `middleware.ts` gates `/account`, `/orders`, `/wishlist`, `/admin`, and `/seller`.
- `/returns` is intentionally public; real return workspaces are `/account/returns` and `/orders/[id]`.
- `/admin/*` requires `public.users.role = ADMIN`.
- `/seller/*` allows `SELLER` or `ADMIN`.

## Current Order Flow

Primary write action: `lib/orders/create-order-intent.ts`.

Expected flow:

1. Client sends product identity, optional variant id, quantity, shipping address id, and notes.
2. Server validates shape and quantity.
3. Server gets buyer from `supabase.auth.getUser()`.
4. Server re-fetches address from `public.addresses`; `user_id` must match buyer.
5. Server re-fetches product, variant, brand, price, stock, and status.
6. Product must be `ACTIVE`; variant must be active and belong to product.
7. Money is recomputed server-side as integer paise.
8. Server inserts `orders` with `status = DRAFT`, null payment fields, null shipping/tax/total.
9. Server inserts `order_items`.
10. Server best-effort inserts `order_events`.

Read paths:

- Buyer: `lib/orders/read-buyer-orders.ts` with `getBuyerOrders()` and `getBuyerOrderById(orderId)`.
- Seller: `lib/orders/read-seller-orders.ts` with `getSellerOrderLines()`; sellers read order item snapshots only, not parent `orders`.
- Admin: `lib/orders/read-admin-orders.ts` with `getAdminOrders()` and `getAdminOrderById(orderId)`.
- Admin status action: `lib/orders/admin-update-order-status.ts`.

Boundaries:

- Buyer id is never client-supplied.
- Client totals, payment state, product title, product price, and image are ignored.
- `PAID` and `REFUNDED` are not set by buyer or admin UI actions here.
- Atomicity is incomplete because Supabase inserts are sequential.

## Current Return Flow

Primary action: `lib/returns/create-return-request.ts`.

Expected flow:

1. Validate input through `lib/returns/return-requests.ts`.
2. Require authenticated buyer.
3. Re-fetch order with `.eq("id", input.orderId).eq("buyer_id", user.id)`.
4. Require `orders.status = DELIVERED`.
5. Re-fetch selected `order_items` by `order_id` and item ids.
6. Reject item mismatch or excessive quantity.
7. Re-read earlier non-`REJECTED` return requests for the order.
8. Net out claimed quantities.
9. Insert `return_requests` as `REQUESTED`.
10. Insert `return_request_items`.

Read paths/UI:

- `lib/returns/read-return-requests.ts`
- `components/orders/order-return-panel.tsx`
- `app/account/returns/page.tsx`

Risk: duplicate active return prevention is app-level and can race until a single-RPC transaction exists.

## Current Support Flow

Primary actions:

- `lib/support/create-support-ticket.ts`
- `lib/support/add-support-ticket-message.ts`

Expected create flow:

1. Validate category, subject, message, optional order id through `lib/support/support-requests.ts`.
2. Require authenticated buyer.
3. Optional linked order must belong to buyer.
4. Insert `support_tickets` as `OPEN`.
5. Insert opening `support_ticket_messages` with `sender_role = BUYER`.
6. Redirect to `/account/support/<ticketId>`.

Expected reply flow:

1. Validate ticket uuid shape and message length.
2. Require authenticated buyer.
3. Re-fetch ticket with `.eq("buyer_id", user.id)`.
4. Allow only `OPEN`, `WAITING_FOR_CUSTOMER`, or `IN_REVIEW` tickets.
5. Insert message with `sender_role = BUYER`.

Read path: `lib/support/read-support-tickets.ts`.

Risk: admin/support staff workflow must use separate admin-verified actions, not buyer reply actions.

## Data Boundaries

- Buyer may read/insert only own orders, returns, and support tickets/messages.
- Seller may read only own post-payment product line snapshots, never buyer address/contact/order totals.
- Admin may read/manage commerce through `public.is_admin()` and server-side role checks.
- Unauthenticated visitors may read public info pages only.

## Tables And RLS Dependencies

Commerce migration `supabase/migrations/0005_commerce_layer.sql` defines:

- `orders`
- `order_items`
- `order_events`
- `support_tickets`
- `support_ticket_messages`
- `return_requests`
- `return_request_items`

Seller order-line fix `supabase/migrations/0006_fix_seller_order_item_rls.sql` defines:

- `public.seller_owns_post_payment_order_line(order_id, product_id)`
- seller `order_items` SELECT policy using that helper

Related files:

- `supabase/migrations/0001_user_layer.sql`
- `supabase/migrations/0003_fix_admin_rls_helper.sql`
- `supabase/migrations/0004_seller_product_lifecycle.sql`
- `supabase/migrations/0007_buyer_saved_items.sql`
- `supabase/verification/0005_commerce_layer_preflight.sql`
- `supabase/verification/0005_commerce_layer_verify.sql`
- `supabase/verification/0005_commerce_layer_isolation.sql`
- `supabase/verification/0008_seller_product_ownership_verify.sql`

## Status Strings

Order: `DRAFT`, `PAYMENT_PENDING`, `PAID`, `FULFILLING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`.

Return: `REQUESTED`, `IN_REVIEW`, `APPROVED`, `PICKUP_PENDING`, `RECEIVED`, `REFUND_PENDING`, `REFUNDED`, `REJECTED`, `CLOSED`.

Support: `OPEN`, `WAITING_FOR_CUSTOMER`, `IN_REVIEW`, `RESOLVED`, `CLOSED`.

Product: `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `REJECTED`, `ARCHIVED`.

## Test Infrastructure Found

- `pnpm run test:commerce` runs action-level commerce tests.
- `supabase/verification/0005_commerce_layer_isolation.sql` tests DB/RLS isolation.
- `supabase/verification/0005_commerce_layer_verify.sql` tests schema/policy presence.
- `supabase/verification/0008_seller_product_ownership_verify.sql` diagnoses seller product ownership.

## Architecture Risks To Review After Claude

- Sequential insert atomicity gaps.
- App-level duplicate return netting race.
- Admin service-role writes must remain behind explicit session-role checks.
- Seller line visibility depends on migration `0006` and correct non-admin seller-owned products.
- Public/internal copy drift around `demo`, `mock`, `placeholder`, and `MVP`.
- Payment state must remain webhook-only when Razorpay is added.

## Exact Files Likely To Require Review After Claude Finishes

- `middleware.ts`
- `app/checkout/page.tsx`
- `components/checkout/place-draft-order.tsx`
- `app/orders/page.tsx`
- `app/orders/[id]/page.tsx`
- `components/orders/order-return-panel.tsx`
- `app/account/returns/page.tsx`
- `app/account/support/page.tsx`
- `app/account/support/[id]/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`
- `app/admin/support/page.tsx`
- `app/admin/returns/page.tsx`
- `app/seller/orders/page.tsx`
- `lib/orders/create-order-intent.ts`
- `lib/orders/read-buyer-orders.ts`
- `lib/orders/read-seller-orders.ts`
- `lib/orders/read-admin-orders.ts`
- `lib/orders/admin-update-order-status.ts`
- `lib/returns/create-return-request.ts`
- `lib/returns/read-return-requests.ts`
- `lib/returns/return-requests.ts`
- `lib/support/create-support-ticket.ts`
- `lib/support/add-support-ticket-message.ts`
- `lib/support/read-support-tickets.ts`
- `lib/support/support-requests.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `supabase/migrations/0005_commerce_layer.sql`
- `supabase/migrations/0006_fix_seller_order_item_rls.sql`
- `supabase/verification/0005_commerce_layer_isolation.sql`
- `tests/commerce-actions.test.cjs`
