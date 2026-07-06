-- =============================================================
-- SKXNZ — Slice 5 verification: internal commerce layer
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
-- EXPECT: orders 3, order_items 3, order_events 2,
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
--         orders insert with check restricts status to DRAFT/PAYMENT_PENDING;
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
--         SELECT only on order_events. No UPDATE/DELETE anywhere.
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

-- 7. Status check constraints exist.
-- EXPECT: rows for orders_status_check, support_tickets_status_check,
--         return_requests_status_check, orders_currency_check, etc.
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

-- 8. updated_at triggers exist.
-- EXPECT: orders_set_updated_at, support_tickets_set_updated_at,
--         return_requests_set_updated_at.
select tgname, tgrelid::regclass as table_name
from pg_trigger
where not tgisinternal
  and tgrelid::regclass::text in ('orders', 'support_tickets', 'return_requests')
order by table_name;

-- =============================================================
-- 9. CROSS-BUYER ISOLATION SPOT-CHECK (manual, needs 2 test users)
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
--    e) With anon key (signed out): select * from orders
--       -> must FAIL with permission denied (no anon grant).
-- =============================================================
