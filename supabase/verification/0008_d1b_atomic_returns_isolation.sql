-- Disposable-QA only. Use distinct buyer sessions and a delivered seeded order.
begin;
-- EXPECT unauthenticated/foreign buyers denied; duplicate item ids rejected;
-- concurrent claims lock/recheck remaining quantity; one request/items/event transaction.
rollback;
