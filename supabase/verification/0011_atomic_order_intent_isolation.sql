-- Disposable QA only; run after 0011, with real JWT role switching and two sessions.
begin;
-- EXPECT anon/SELLER/ADMIN calls denied; buyer success returns one DRAFT with lines+event;
-- same key/payload returns same order; same key/different payload conflicts; invalid/stale
-- product/variant/stock fails with no order; two sessions using same key yield one order.
-- Confirm payment fields, buyer_id, prices, totals, seller ids are not RPC parameters.
rollback;
