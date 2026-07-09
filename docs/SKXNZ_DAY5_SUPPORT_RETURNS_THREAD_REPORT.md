# SKXNZ Day 5 — D5-3B / D5-4A Support Thread + Returns List Report

Branch: `day3-cart-order-flow`
Date: 2026-07-09
Session: D5-3B / D5-4A (completes buyer support/returns surfaces)

---

## What Existed Before

### Backend (D4-5, committed)
- `lib/support/create-support-ticket.ts` — `createSupportTicket`
- `lib/support/add-support-ticket-message.ts` — `addSupportTicketMessage` (buyer reply, session-auth, ticket-must-be-active OPEN/WAITING_FOR_CUSTOMER/IN_REVIEW)
- `lib/returns/create-return-request.ts` — `createReturnRequest`
- `lib/support/support-requests.ts` — categories, statuses, validator
- `lib/returns/return-requests.ts` — statuses, validator

### D5-3 surfaces (commit 30c8990)
- `lib/support/read-support-tickets.ts` — `getBuyerSupportTickets()` (list only)
- `components/support/buyer-support-form.tsx` — create-ticket form
- `app/account/support/page.tsx` — support page (form + ticket list, tickets NOT clickable)
- `components/orders/order-return-panel.tsx` — return request panel on order detail

### Schema (0005 applied D4-7, verified)
- `support_tickets` (id, buyer_id, order_id, category, status, subject, priority, created_at, updated_at)
- `support_ticket_messages` (id, ticket_id, sender_id, sender_role BUYER/SUPPORT/ADMIN/SYSTEM, message, metadata, created_at)
- `return_requests` (id, order_id, buyer_id, status, reason, note, created_at, updated_at)
- `return_request_items` (id, return_request_id, order_item_id, quantity, reason, created_at)
- RLS confirmed: buyer selects own tickets / messages (via ticket) / return_requests (buyer_id) / return_request_items (via request). Grants = select+insert only. No UPDATE/DELETE for `authenticated`.

### Missing
- No ticket thread/detail page — buyer could not read messages or reply
- Ticket list rows were not links
- No return-request read helper — buyer could not see submitted returns
- No `/account/returns` page

---

## Files Changed

### New
| File | Description |
|------|-------------|
| `lib/returns/read-return-requests.ts` | `getBuyerReturnRequests()` — own returns + per-request item count, session client, 42P01-safe |
| `app/account/support/[id]/page.tsx` | Buyer ticket thread; reads one owned ticket + messages; `notFound()` on missing/not-owned; reply form on active tickets |
| `components/support/ticket-reply-form.tsx` | `"use client"` reply form calling real `addSupportTicketMessage`; "Message added" honest state |
| `app/account/returns/page.tsx` | Buyer return-request list; honest per-status labels |

### Modified
| File | Change |
|------|--------|
| `lib/support/read-support-tickets.ts` | Added `getBuyerSupportTicketThread(ticketId)` (ticket + ordered messages), thread/message types; imports `isOrderIdShape` for junk-id rejection |
| `app/account/support/page.tsx` | Ticket rows are now `<Link>` → `/account/support/[id]` (hover state, premium) |
| `components/account/account-shell.tsx` | Account nav gained "Returns" + "Support" tabs |
| `app/account/page.tsx` | Added "My Returns" button → `/account/returns` |

---

## Backend Helpers / Actions Used

| Helper / Action | Source | Used by |
|-----------------|--------|---------|
| `getBuyerSupportTicketThread` | `lib/support/read-support-tickets.ts` (new fn) | `/account/support/[id]` |
| `addSupportTicketMessage` | `lib/support/add-support-ticket-message.ts` (D4-5) | `TicketReplyForm` |
| `getBuyerReturnRequests` | `lib/returns/read-return-requests.ts` (new) | `/account/returns` |
| `getBuyerSupportTickets` | `lib/support/read-support-tickets.ts` (D5-3) | `/account/support` list |

---

## Support Thread Behaviour

1. `/account/support` — each ticket row links to `/account/support/[id]` (status, subject, category, order ref, date).
2. `/account/support/[id]`:
   - `isOrderIdShape` rejects junk uuids before any DB call.
   - Reads one ticket via RLS + `.eq("buyer_id", user.id)`. Missing OR another buyer's ticket → zero rows → `notFound()` (no existence leak).
   - Renders header (short id, status badge, category, linked-order ref + "View Linked Order" if present) and the message thread ordered by `created_at`.
   - Buyer messages vs SKXNZ Support/System are styled distinctly (label per `sender_role`).
   - If status ∈ {OPEN, WAITING_FOR_CUSTOMER, IN_REVIEW}: `TicketReplyForm` shown. Submit calls `addSupportTicketMessage` (server re-verifies ownership + active status + inserts `sender_role: BUYER`). Success → "Message added. SKXNZ support will review this — there is no automated resolution." + `router.refresh()`.
   - If RESOLVED/CLOSED: honest closed notice, no reply form (mirrors the RLS insert policy).
   - `!backendReady` (42P01 — dead post-0005): honest "not connected yet" card.

No fake staff reply, no fake resolution, no status change from the buyer side.

## Return List Behaviour

1. `/account/returns` (linked from account overview "My Returns" + nav "Returns" tab).
2. Lists the session buyer's own `return_requests` newest-first: order short ref, status label, reason, return short id, item count, created date, "View Order" link.
3. Status labels stay honest — `REQUESTED` → "Submitted for review"; approved/pickup/refund states are only ever set server-side by real ops/provider action, never faked here. Page description states "no pickup or refund has been confirmed until SKXNZ updates the status here."
4. Empty state → "not submitted any return requests yet" + link to `/orders`.
5. `!backendReady` → honest "not connected yet" state.

---

## SQL Needed

**None.** All tables + RLS + grants come from `0005_commerce_layer.sql` (applied + verified live in D4-7) and `0006_fix_seller_order_item_rls.sql`. This slice is read + reuse only. `0007_buyer_saved_items.sql` (D5-1) remains unapplied and untouched.

---

## Checks Run

- `npx tsc --noEmit` → EXIT 0 (zero errors).
- Secret grep (`service_role|sk_live_|rzp_live_`) over `app/account`, `components/support`, `lib/support`, `lib/returns` → no matches.
- Dev server route probe: `/account/returns`, `/account/support/[uuid]`, `/account/support` all compile + serve (200 after middleware redirect to `/login`); server logs show only the standing `TypeError: fetch failed` (Supabase unreachable from this machine) — no compile/module errors on the new routes.
- `git status` — 4 pre-existing unrelated untracked files remain excluded.

---

## Known Limitations

1. **No delivered orders live** → return requests cannot be created end-to-end yet (needs Razorpay + admin fulfilment to reach DELIVERED). Read/list path is fully wired and safe; only real data is absent.
2. **Logged-in render not browser-verified** — Supabase unreachable from dev machine (standing blocker). Compile + route + typecheck confirmed only.
3. **No staff-reply ingestion UI** — buyer sees SUPPORT/ADMIN messages if they exist, but there is no admin/support console to create them yet (admin-side support tooling is a later slice).
4. **No return detail page** — returns list links to the order, not a dedicated return thread. Sufficient for V1.
5. **Item count is a second query**, not a join — negligible at buyer scale; degrades to 0 on error rather than failing the list.

---

## Recommended Next D5 Task (D5-4B)

**Admin/support ticket + return console.**
1. `/admin/support` — list all tickets (admin RLS), open a ticket, reply as SUPPORT/ADMIN via a new `addStaffTicketMessage` server action (admin-verified, `sender_role: SUPPORT`), and set ticket status (OPEN→IN_REVIEW→WAITING_FOR_CUSTOMER→RESOLVED/CLOSED) via a status action.
2. `/admin/returns` — list all return requests, view items, and move status through the review lifecycle (REQUESTED→IN_REVIEW→APPROVED/REJECTED) with an audit trail. **No refund execution** until a real provider refund path exists.
3. Reuse the D4-6 admin-order pattern (session client for reads, admin-verified action for writes; service-role only where a grant genuinely blocks the write, never in client code).
