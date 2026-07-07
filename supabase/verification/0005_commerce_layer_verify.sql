-- =============================================================
-- SKXNZ — Slice 5 verification: internal commerce layer (D4-2)
-- Run AFTER applying 0005_commerce_layer.sql in the SQL Editor.
-- Every query is read-only. Expected results in comments.
-- =============================================================

-- 1. All 7 commerce tables exist.
-- EXPECT: 7 rows.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by table_name;

-- 2. RLS is enabled on all 7.
-- EXPECT: 7 rows, all rowsecurity = true.
select relname, relrowsecurity as rowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by relname;

-- 3. Policies exist per table.
-- EXPECT: orders 3, order_items 4 (buyer select, seller select,
--         buyer insert, admin all), order_events 2,
--         support_tickets 3, support_ticket_messages 3,
--         return_requests 3, return_request_items 3.
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
  and tablename in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
group by tablename
order by tablename;

-- 4. Full policy listing for manual review.
-- EXPECT: buyer policies filter on auth.uid(); admin policies use is_admin();
--         orders insert with_check restricts status to DRAFT/PAYMENT_PENDING
--         AND requires payment_provider/payment_reference IS NULL;
--         order_items seller select joins public.products on seller_id and
--         excludes DRAFT/PAYMENT_PENDING orders;
--         support_tickets insert requires OPEN + own order (or null order);
--         support_ticket_messages insert requires active ticket status
--         (OPEN/WAITING_FOR_CUSTOMER/IN_REVIEW);
--         return_requests insert requires own DELIVERED order;
--         return_request_items insert requires order_item from the SAME
--         order as the return request;
--         NO buyer update policy on orders; NO buyer insert on order_events.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by tablename, policyname;

-- 5. anon has ZERO privileges on commerce tables.
-- EXPECT: 0 rows.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  );

-- 6. authenticated grants match the intended surface.
-- EXPECT: SELECT+INSERT on orders, order_items, support_tickets,
--         support_ticket_messages, return_requests, return_request_items;
--         SELECT only on order_events. NO UPDATE/DELETE/TRUNCATE rows —
--         the migration revokes Supabase's default ALL grant first.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by table_name, privilege_type;

-- 7. Check constraints exist, including money-consistency rules.
-- EXPECT: rows include orders_status_check, orders_currency_check,
--         orders_total_consistent, order_items_line_total_consistent,
--         order_items_quantity_positive, order_events_event_type_not_blank,
--         support_tickets_status_check, support_tickets_category_check,
--         support_tickets_priority_check, return_requests_status_check,
--         return_request_items_quantity_positive, plus the nonnegative
--         paise checks.
select conname, conrelid::regclass as table_name
from pg_constraint
where connamespace = 'public'::regnamespace
  and contype = 'c'
  and conrelid::regclass::text in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by table_name, conname;

-- 8. Foreign keys are in place.
-- EXPECT: orders.buyer_id -> users (NO cascade);
--         order_items.order_id -> orders (CASCADE);
--         order_events.order_id -> orders (CASCADE);
--         support_tickets.buyer_id -> users, .order_id -> orders;
--         support_ticket_messages.ticket_id -> support_tickets (CASCADE),
--         .sender_id -> users;
--         return_requests.order_id -> orders, .buyer_id -> users;
--         return_request_items.return_request_id -> return_requests
--         (CASCADE), .order_item_id -> order_items.
select
  conname,
  conrelid::regclass  as table_name,
  confrelid::regclass as references_table,
  confdeltype         as on_delete  -- 'a' = no action, 'c' = cascade
from pg_constraint
where connamespace = 'public'::regnamespace
  and contype = 'f'
  and conrelid::regclass::text in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by table_name, conname;

-- 9. Indexes exist.
-- EXPECT: rows include orders_buyer_id_idx, orders_status_idx,
--         orders_created_at_idx, order_items_order_id_idx,
--         order_items_product_id_idx, order_events_order_id_idx,
--         support_tickets_buyer_id_idx, support_tickets_order_id_idx,
--         support_ticket_messages_ticket_id_idx,
--         return_requests_order_id_idx, return_requests_buyer_id_idx,
--         return_request_items_request_id_idx,
--         return_request_items_order_item_id_idx.
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by tablename, indexname;

-- 10. updated_at triggers exist.
-- EXPECT: orders_set_updated_at, support_tickets_set_updated_at,
--         return_requests_set_updated_at.
select tgname, tgrelid::regclass as table_name
from pg_trigger
where not tgisinternal
  and tgrelid::regclass::text in ('orders', 'support_tickets', 'return_requests')
order by table_name;

-- =============================================================
-- 11. CROSS-BUYER ISOLATION SPOT-CHECK (manual, needs 2 test users)
--    a) Sign in as buyer A in the app; insert one DRAFT order via
--       authenticated client. select * from orders -> sees own row.
--    b) Sign in as buyer B; select * from orders -> must NOT return
--       buyer A's order (0 rows).
--    c) As buyer B, attempt:
--         insert into orders (buyer_id, status, ...) values (<buyer A id>, 'DRAFT', ...)
--       -> must FAIL with RLS violation.
--    d) As any buyer, attempt:
--         update orders set status = 'PAID' where id = <own order>
--       -> must FAIL (no update grant/policy for authenticated).
--    e) As any buyer, attempt inserting an order with
--         payment_provider = 'X' or payment_reference = 'X'
--       -> must FAIL with RLS violation (policy requires both NULL).
--    f) With anon key (signed out): select * from orders
--       -> must FAIL with permission denied (no anon grant).
--    g) Seller check (needs a SELLER user with a live product):
--       as the seller, select * from order_items -> returns only lines
--       whose product belongs to the seller AND whose parent order is
--       past PAYMENT_PENDING; DRAFT-order lines never appear.
-- =============================================================
