# SKXNZ D1 Regression Test Matrix

Use after Claude's final D1-A commit is locally available. Do not mark a row passed until it is actually executed.

| ID | Precondition | Action | Expected result | Likely file area | Automation method | Severity | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1-AUTH-001 | No session | Visit `/orders`, `/account/returns`, `/account/support` | Redirect to `/login?next=...`; no protected data | `middleware.ts` | Browser/Playwright | High | TODO |
| D1-AUTH-002 | Buyer session | Visit `/admin/orders` | Redirect home with `?denied=role` | `middleware.ts` | Browser | Critical | TODO |
| D1-AUTH-003 | Buyer session | Visit `/seller/orders` | Redirect home with `?denied=role` | `middleware.ts` | Browser | High | TODO |
| D1-BUYER-001 | Buyer A/B orders | Buyer A opens Buyer B order id | Not found/missing; no leak | `app/orders/[id]/page.tsx`, `read-buyer-orders.ts` | RLS + browser | Critical | TODO |
| D1-BUYER-002 | Buyer A has orders | Open `/orders` | Only Buyer A orders | `read-buyer-orders.ts` | RLS | Critical | TODO |
| D1-BUYER-003 | Junk order id | Open `/orders/not-a-uuid` | Not found without DB uuid error | `isOrderIdShape` | Unit/browser | Medium | TODO |
| D1-SELLER-001 | Seller A owns paid line | Open `/seller/orders` | Own line visible; no buyer address/contact/totals | `read-seller-orders.ts` | RLS + browser | Critical | TODO |
| D1-SELLER-002 | Seller B exists | Seller B opens seller queue | Seller A line absent | `0006_fix_seller_order_item_rls.sql` | RLS | Critical | TODO |
| D1-SELLER-003 | Draft/payment-pending line | Seller A opens queue | Hidden | `0006` | RLS | Critical | TODO |
| D1-ADMIN-001 | Admin session | Open `/admin/orders` | All orders visible safely | `read-admin-orders.ts` | Browser | High | TODO |
| D1-ADMIN-002 | Non-admin | Call admin status action | `FORBIDDEN`; no mutation | `admin-update-order-status.ts` | Unit | Critical | TODO |
| D1-ADMIN-003 | Admin + DRAFT order | Move DRAFT to PAID | Rejected | `ALLOWED_TRANSITIONS` | Unit | Critical | TODO |
| D1-MONEY-001 | Forged price/total/payment fields | Call `createOrderIntent` | DB price, DRAFT, null payment | `create-order-intent.ts` | `pnpm run test:commerce` | Critical | TODO |
| D1-MONEY-002 | Variant price exists | Create order | Variant DB price wins | `create-order-intent.ts` | Unit | Critical | TODO |
| D1-MONEY-003 | Product inactive | Create order | `PRODUCT_UNAVAILABLE` | `create-order-intent.ts` | Unit | Critical | TODO |
| D1-ITEM-001 | Bad quantity | Create order | Validation failed before insert | `create-order-intent.ts` | Unit | High | TODO |
| D1-ITEM-002 | Variant from other product | Create order | `PRODUCT_UNAVAILABLE` | `create-order-intent.ts` | Unit | Critical | TODO |
| D1-ITEM-003 | Low stock | Create order | `OUT_OF_STOCK` | `create-order-intent.ts` | Unit | Critical | TODO |
| D1-RETURN-001 | Non-DELIVERED order | Create return | `NOT_ELIGIBLE` | `create-return-request.ts` | Unit | Critical | TODO |
| D1-RETURN-002 | Foreign order id | Create return | `ORDER_NOT_FOUND` | `create-return-request.ts` | Unit + RLS | Critical | TODO |
| D1-RETURN-003 | Foreign order item | Create return | `ITEM_MISMATCH` | `create-return-request.ts` | Unit | Critical | TODO |
| D1-RETURN-004 | Quantity too high | Create return | `QUANTITY_EXCEEDED` | `create-return-request.ts` | Unit | Critical | TODO |
| D1-RETURN-005 | Prior active return | Create same return | `ALREADY_REQUESTED` or `QUANTITY_EXCEEDED` | returns layer | Unit | Critical | TODO |
| D1-RETURN-006 | Prior REJECTED return | Create same return | Allowed if qty valid | returns layer | Unit | High | TODO |
| D1-RETURN-007 | Concurrent double submit | Fire duplicate submissions | Race documented or fixed by future RPC | returns layer | Manual/future DB | High | TODO |
| D1-SUPPORT-001 | Foreign order link | Create ticket | `ORDER_NOT_FOUND`; no ticket | `create-support-ticket.ts` | Unit | Critical | TODO |
| D1-SUPPORT-002 | Junk order id | Create ticket | Reject before DB call | `create-support-ticket.ts` | Unit | Medium | TODO |
| D1-SUPPORT-003 | Foreign ticket id | Open ticket | Not found; no leak | `read-support-tickets.ts` | Browser/unit | Critical | TODO |
| D1-SUPPORT-004 | Foreign ticket reply | Reply | `TICKET_NOT_FOUND`; no message | `add-support-ticket-message.ts` | Unit | Critical | TODO |
| D1-SUPPORT-005 | Closed ticket | Reply | `TICKET_NOT_ACTIVE`; not reopened | support action | Unit | High | TODO |
| D1-SUPPORT-006 | Forged staff role | Reply as buyer | Stored role remains BUYER | support action | Unit | Critical | TODO |
| D1-PAY-001 | Client sets paid fields | Create order | Ignored; no paid state | order action | Unit | Critical | TODO |
| D1-PAY-002 | Admin sets REFUNDED | Status action | Rejected | admin action | Unit | Critical | TODO |
| D1-ROUTE-001 | Foreign protected id | Open order/support | 404/missing, no owner clue | routes/read helpers | Browser + unit | High | TODO |
| D1-STATE-001 | Backend missing/unreachable | Load commerce pages | Honest not-ready state, no fake success | read helpers/pages | Mock/manual | Medium | TODO |
| D1-MOBILE-001 | 390px viewport | Open support/returns/orders/account support | No overflow; gates correct | app/components | Playwright | Medium | TODO |
| D1-SECRET-001 | Tracked source | Scan secret patterns | No browser-exposed secrets | source tree | readiness script | Critical | TODO |
| D1-COPY-001 | Rendered source | Scan demo/mock/placeholder/MVP | Findings reviewed, no public overclaim | app/components/lib | readiness script | Medium | TODO |
| D1-TYPE-001 | Deps installed | Run typecheck | Exit 0 | whole repo | `pnpm run typecheck` | High | TODO |
| D1-LINT-001 | Deps installed | Run lint | Exit 0 or baseline recorded | whole repo | `pnpm run lint` | Medium | TODO |
| D1-TEST-001 | Deps installed | Run commerce tests | Pass | tests | `pnpm run test:commerce` | Critical | TODO |
| D1-BUILD-001 | Optional build | Run readiness with build | Build succeeds or exact failure recorded | whole repo | readiness build flag | High | TODO |
