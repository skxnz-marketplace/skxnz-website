# SKXNZ Launch War Day 12-A - Global Idempotency Hardening

Branch: `codex/d12a-global-idempotency`  
Worktree: `skxnz-d12a-global-idempotency`  
Base: `6532a4c merge(ui): integrate founder homepage polish with buyer recovery`

No live SQL executed. No push. No deploy.

## Mutation Audit

| Area | Operation | Safety status | D12-A action |
|---|---|---:|---|
| Checkout/orders | `createOrderIntent` | Safe | Already RPC-only via `create_order_intent_atomic`, request key, fingerprint conflict, no sequential fallback. Proved by existing tests. |
| Returns | `createReturnRequest` | Fixed | Rewired from split `return_requests` + `return_request_items` inserts to `create_return_request_idempotent` RPC. Browser sends stable key across retry. |
| Buyer support | `createSupportTicket` | Fixed | Rewired from split ticket/message inserts to `create_support_ticket_idempotent` RPC. Browser sends stable key across retry. |
| Buyer support replies | `addSupportTicketMessage` | Fixed | Rewired direct message insert to `add_support_ticket_message_idempotent` RPC. Browser sends stable key across retry. |
| Wishlist | `saveProduct` / `removeSavedProduct` | Safe | Save relies on unique `(buyer, slug, size, variant)` index and treats `23505` as idempotent success; delete is naturally idempotent for target row. |
| Addresses | create/update/delete/default | Partially safe | Ownership/RLS and repeat update/delete are safe. Create can still duplicate identical addresses until a future address fingerprint/RPC step. Default change remains split update/update; not money/order state. |
| Seller product create | `createSellerProduct` | Needs next hardening | Multi-write product/variant/image create can leave partial product if later insert fails. Needs seller product RPC after catalog baseline is stable. |
| Seller fulfilment | `updateSellerLineFulfilment` | Safe | Already RPC-only via `seller_update_line_fulfilment`; row lock, forward-only transition, no fallback. |
| Admin order status | `adminUpdateOrderStatus` | Safe | Already RPC-only via `admin_update_order_status_atomic`; transition validation, conflict behavior, no fallback. |
| Admin return status | `adminUpdateReturnStatus` | Safe | Already RPC-only via `admin_update_return_status_atomic`; transition validation, conflict behavior, no fallback. |
| Admin support status | `adminUpdateSupportTicketStatus` | Mostly safe | Conditional update on current status prevents stale overwrite; repeated same transition is rejected. No audit-event RPC yet. |
| Admin support reply | `adminAddSupportReply` | Needs next hardening | Direct insert can duplicate on admin double-click. Needs admin reply idempotency key/RPC. |
| Admin product moderation | `updateProductModerationStatus` | Safe enough | Setting status is idempotent; repeat same status does not create extra rows. No audit event exists yet. |
| Auth mutations | sign up, sign in, sign out | External | Supabase Auth owns behavior. No app database duplicate write in these client calls. |
| Account/profile | sign out | Safe | Session mutation only; repeat sign-out is safe. |
| AI API routes | assistant/outfit/try-on mock routes | No persistent write | Runtime responses only in current repo state. |

## Implemented

- Added draft migration `0016_global_idempotency_hardening.sql`.
- Added idempotency metadata and unique indexes for support tickets, support messages, and return requests.
- Added RPCs:
  - `create_support_ticket_idempotent`
  - `add_support_ticket_message_idempotent`
  - `create_return_request_idempotent`
- Rewired buyer support/return actions to RPC-only boundaries.
- Removed split-write fallback for those buyer workflows.
- Added stable browser idempotency keys for support ticket, support reply, and return request forms.
- Updated regression tests to assert RPC usage and no direct table insert for the fixed paths.

## Validation

- `pnpm.cmd run test:commerce`: 129/129 passing.

## Remaining Operator Dependencies

- Apply `0016_global_idempotency_hardening.sql` only in disposable Supabase QA first.
- Run isolation/concurrency SQL for duplicate submit, conflicting key, and row-lock behavior before production.
- Do not claim live support/return idempotency until 0012 is applied and verified.

## Remaining Launch Blockers

- Address create/default needs atomic address RPC or fingerprint unique constraint.
- Seller product creation needs atomic RPC for product + variants + images.
- Admin support reply needs idempotency key/RPC.
- Payments still have no external gateway idempotency; no payment idempotency claim made.
