# SKXNZ Day 5 — D5-3 Buyer Support & Returns UI Report

Branch: `day3-cart-order-flow`
Date: 2026-07-09
Session: D5-3

---

## What Existed Before

### Backend actions (D4-5, already committed)
- `lib/returns/create-return-request.ts` — `createReturnRequest` server action
- `lib/support/create-support-ticket.ts` — `createSupportTicket` server action
- `lib/support/add-support-ticket-message.ts` — `addSupportTicketMessage` server action
- `lib/support/support-requests.ts` — `SupportTicketCategory`, `supportTicketCategories`, validator
- `lib/returns/return-requests.ts` — `CreateReturnRequestInput`, `ReturnRequestItemInput`, validator
- `lib/orders/read-buyer-orders.ts` — `BuyerOrderStatus`, `BuyerOrderItem`, `getBuyerOrderById`, `isOrderIdShape`

### Order detail page (D4-4, already committed)
- `app/orders/[id]/page.tsx` — buyer order detail, honest status labels, no payment/tracking UI

### Account page (pre-existing)
- `app/account/page.tsx` — Browse Shop + Sign Out buttons only

### What was missing
- No buyer-facing UI to call `createSupportTicket` or `createReturnRequest`
- No `/account/support` page
- No return panel on order detail
- No read helper for listing a buyer's own support tickets

---

## Files Changed

### New files
| File | Description |
|------|-------------|
| `lib/support/read-support-tickets.ts` | `getBuyerSupportTickets()` — session client, `.eq("buyer_id", user.id)`, 42P01-safe |
| `components/support/buyer-support-form.tsx` | `"use client"` form calling real `createSupportTicket`; category select, subject, message, `defaultOrderId` prop |
| `app/account/support/page.tsx` | `requireUser`-gated server page; `searchParams.order` validated with `isOrderIdShape`; form + ticket list |
| `components/orders/order-return-panel.tsx` | `"use client"` DELIVERED-gated panel calling real `createReturnRequest`; checkbox per item, qty selector, reason input |

### Modified files
| File | Change |
|------|--------|
| `app/orders/[id]/page.tsx` | Added `<OrderReturnPanel>` after shipping address card; added "Contact Support About This Order" link card |
| `app/account/page.tsx` | Added "Contact Support" button → `/account/support` |

---

## Migration Needed

None. All tables (`support_tickets`, `support_ticket_messages`, `return_requests`, `return_request_items`) are from `0005_commerce_layer.sql`, which was applied and verified live in D4-7.

The `0007_buyer_saved_items.sql` migration (D5-1) is still unapplied and unaffected by this slice.

---

## Backend Actions Used

| Action | Source | Called From |
|--------|--------|-------------|
| `createSupportTicket` | `lib/support/create-support-ticket.ts` | `BuyerSupportForm` |
| `createReturnRequest` | `lib/returns/create-return-request.ts` | `OrderReturnPanel` |
| `getBuyerSupportTickets` | `lib/support/read-support-tickets.ts` | `app/account/support/page.tsx` |

`addSupportTicketMessage` exists (D4-5) but is not wired to buyer UI yet — recommended for D5-4.

---

## Buyer Support Behaviour After Change

1. Buyer clicks "Contact Support" on `/account` → lands on `/account/support`
2. Buyer selects category (ORDER / RETURN / PAYMENT / DELIVERY / PRODUCT / ACCOUNT / OTHER), enters subject + message
3. If arriving from `/orders/[id]` via "Contact Support About This Order" link, the `order` query param is validated (`isOrderIdShape`) and pre-links the ticket
4. On submit: calls real `createSupportTicket` server action; ticket inserted as `status: OPEN` in `public.support_tickets` + opening BUYER message in `support_ticket_messages`
5. Success state: "SKXNZ support will review this. Ticket reference XXXXXXXX." + "Open Another Ticket" button (no fake resolution)
6. Error state: exact `result.message` from the action in an error panel
7. Ticket list below form shows all buyer's own tickets (subject, status badge, category, order ref, date)
8. 42P01 / backend not ready: "Support is not connected yet. Nothing was lost." (still honest while 0005 unapplied — but 0005 IS applied, so this branch is dead in production)

No fake instant resolution. No automated reply claim. Buyer owns their `buyer_id` only via session — never from client input.

---

## Buyer Return Behaviour After Change

1. On `/orders/[id]`, `OrderReturnPanel` renders below the shipping address card
2. If `order.status !== "DELIVERED"`:
   - DRAFT / PAYMENT_PENDING: "This order is not paid yet, so there is nothing to return."
   - CANCELLED: "This order was cancelled."
   - REFUNDED: "This order has already been refunded."
   - PAID / FULFILLING / SHIPPED: "Returns can be requested only after an order is delivered."
3. If `DELIVERED`: form shows item checkboxes with quantity selectors (for qty > 1), reason input, optional note
4. On submit: calls real `createReturnRequest`; inserts one `return_requests` row (`status: REQUESTED`) + N `return_request_items`
5. Success state: "Return request submitted for review. No refund has been approved and no pickup has been scheduled." + return reference
6. No fake refund approval, no fake pickup, no courier/tracking claim
7. `router.refresh()` on success so the page re-renders if the server emits updated data

Action re-verifies server-side: buyer must own the order AND order must be `DELIVERED`; item must belong to that exact order; quantity ≤ purchased. All server-authoritative.

---

## Checkout/Order Impact

None. No checkout or cart files changed. No payment logic touched.

---

## Checks Run

### TypeScript
```
npx tsc --noEmit
```
Exit 0 — zero errors.

### Secret grep
```
pattern: service_role|sk_live_|rzp_live_
scope: **/*.{ts,tsx}
```
Two file hits — both are comment lines (`// No service_role...`), not actual usage. Clean.

### Git status
D5-3 untracked files confirmed present. Four pre-existing unrelated untracked files excluded from this commit:
- `AGENTS.md`
- `docs/SKXNZ_D2_5_CONTROL_PACK.md`
- `docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`
- `docs/SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md`

---

## Known Limitations

1. **No buyer reply UI** — `addSupportTicketMessage` exists server-side but no UI wired. Buyer can open a new ticket but cannot reply to an existing one. → D5-4.
2. **No ticket detail page** — `/account/support` lists tickets but a buyer cannot see the ticket thread or any staff replies. → D5-4.
3. **No delivered orders yet** — `OrderReturnPanel` always shows the disabled state until a real order reaches `DELIVERED` status (requires Razorpay + admin fulfilment flow). The panel renders and the return action is fully wired; the eligibility gate is intentional.
4. **Supabase unreachable from dev machine** — standing `TypeError: fetch failed` blocker. All paths have 42P01 / NOT_WIRED honest fallbacks. Browser smoke was confirmed at compile/route level only.
5. **No return request list for buyers** — buyers currently cannot see their own return requests. → D5-4 read helper needed.

---

## Recommended D5-4 Task

**Buyer ticket thread + return request status panel**

1. Add `getBuyerReturnRequests()` read helper in `lib/returns/read-return-requests.ts` (session client, `.eq("buyer_id", user.id)`, 42P01-safe, same pattern as `getBuyerSupportTickets`)
2. Add `getTicketMessages(ticketId)` read helper (buyer owns ticket, select messages ordered by `created_at`)
3. Add `/account/support/[id]` ticket detail page: thread of messages, status badge, buyer reply form wired to `addSupportTicketMessage`
4. Add `/account/returns` page listing buyer's return requests (status: REQUESTED / APPROVED / REJECTED, item list, reference)
5. On `/orders/[id]` link to relevant return request if one exists for this order
