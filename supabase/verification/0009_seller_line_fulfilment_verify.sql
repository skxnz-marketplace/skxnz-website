-- =============================================================
-- SKXNZ — 0009 verification (read-only, run in Supabase SQL Editor
-- AFTER applying supabase/migrations/0009_seller_line_fulfilment.sql).
-- Compare each result to its EXPECT comment.
-- =============================================================

-- 1. New columns exist with the correct types + defaults.
--    EXPECT: 3 rows (status text NOT NULL default 'PENDING', note text NULL,
--            updated_at timestamptz NULL).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'order_items'
  and column_name in (
    'seller_fulfilment_status',
    'seller_fulfilment_note',
    'seller_fulfilment_updated_at'
  )
order by column_name;

-- 2. Status check constraint permits exactly the 4 allowed values.
--    EXPECT: 1 row containing all four statuses in check_clause.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.order_items'::regclass
  and conname = 'order_items_seller_fulfilment_status_check';

-- 3. Index present.
--    EXPECT: 1 row (order_items_seller_fulfilment_status_idx).
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'order_items'
  and indexname = 'order_items_seller_fulfilment_status_idx';

-- 4. order_item_events table exists, RLS on, and has 3 policies + 0 grants
--    to anon.
--    EXPECT (queries below combined): rls_enabled = true, policy_count = 3,
--    anon_grant_count = 0, authenticated_grant_privileges = SELECT only.
select relrowsecurity as rls_enabled
from pg_class
where oid = 'public.order_item_events'::regclass;

select count(*)::int as policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'order_item_events';

select count(*)::int as anon_grant_count
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'order_item_events'
  and grantee = 'anon';

select privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'order_item_events'
  and grantee = 'authenticated'
order by privilege_type;

-- 5. order_items has NOT gained any UPDATE grant for anon/authenticated
--    (the seller/admin action must go through service_role).
--    EXPECT: 0 rows.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'order_items'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('UPDATE', 'DELETE');

-- 6. Atomic RPC + scoped-return RPC: EXPECT two SECURITY DEFINER functions,
-- with an explicit search_path and EXECUTE granted only to authenticated.
select p.oid::regprocedure as function_name, p.prosecdef as security_definer, p.proconfig
from pg_proc p
where p.oid in (
  'public.seller_update_line_fulfilment(uuid,text,text,text)'::regprocedure,
  'public.seller_active_return_indicators(uuid[])'::regprocedure
)
order by function_name::text;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('seller_update_line_fulfilment', 'seller_active_return_indicators')
  and grantee in ('anon', 'authenticated', 'public')
order by routine_name, grantee;

-- =============================================================
-- 6. MANUAL ISOLATION HINTS (not runnable inline — use the
--    0005 isolation harness pattern to prove these once seeded):
--    * Seller A can SELECT order_item_events for their OWN line;
--      Seller B (different seller) sees ZERO rows.
--    * Buyer can SELECT events for their own order's lines only.
--    * anon SELECT on order_item_events fails with 42501.
--    * authenticated INSERT on order_item_events fails with 42501
--      (only service_role writes).
-- =============================================================
