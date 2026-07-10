-- D1-B atomic return claim boundary. Apply separately; no live SQL was run.
alter table public.return_requests add constraint return_requests_reason_length_d1b check (char_length(btrim(reason)) between 1 and 500) not valid;
alter table public.return_requests add constraint return_requests_note_length_d1b check (note is null or char_length(note) <= 2000) not valid;
alter table public.return_request_items add constraint return_request_items_reason_length_d1b check (reason is null or char_length(reason) <= 500) not valid;
revoke insert on public.return_requests, public.return_request_items from authenticated;
drop policy if exists "return_requests: buyer can insert own requested" on public.return_requests;
drop policy if exists "return_request_items: buyer can insert own" on public.return_request_items;
-- The production RPC must lock the delivered order, validate all item ownership and remaining
-- quantities, then insert request/items/event in one transaction. It is intentionally supplied
-- as a draft migration for operator review and is not executed by this commit.
