-- SKXNZ 0009 two-seller isolation / atomicity operator harness (DRAFT).
-- Never run against production data without replacing only test ids and
-- keeping the enclosing transaction + final rollback.
begin;

-- Configure distinct non-admin SELLER A/B, a BUYER, and seller-owned product
-- ids before execution. Seed one PAID shared order with one line per seller.
-- Then verify, using authenticated JWT claims in the 0005 harness pattern:
-- A) seller A reads only A's line; seller B reads only B's line; neither can
--    select public.orders, support_tickets, or support_ticket_messages.
-- B) seller_active_return_indicators([lineA,lineB]) returns only the caller's
--    active line (REQUESTED..REFUND_PENDING), never REJECTED/CLOSED/REFUNDED.
-- C) seller A cannot mutate B's line: RPC raises SKXNZ_LINE_NOT_FOUND.
-- D) concurrent PENDING->ACCEPTED calls on A's line yield one success and
--    one SKXNZ_INVALID_TRANSITION; one matching STATUS_CHANGED audit row has
--    actor_user_id = seller A. This proves the locked atomic boundary.
-- E) skipped/repeated/backwards transitions and >500-char notes are denied.
-- F) anon cannot execute either RPC; buyer cannot mutate/read seller return
--    context; existing admin order actions remain separately testable.

-- The operator records PASS/FAIL externally. No test rows are inserted by
-- this template and the transaction is rolled back unconditionally.
rollback;
