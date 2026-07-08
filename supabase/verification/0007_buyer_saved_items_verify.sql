-- =============================================================
-- SKXNZ — D5-1 verification for 0007_buyer_saved_items.sql
-- Read-only. Run in the Supabase SQL Editor AFTER applying 0007.
-- Compare each result to its EXPECT comment.
-- =============================================================

-- 1. Table exists + RLS enabled (EXPECT: 1 row, rls_enabled = true)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'saved_items';

-- 2. Policies (EXPECT: 4 rows — owner select, admin select, owner insert, owner delete)
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'saved_items'
order by policyname;

-- 3. Anon has ZERO grants (EXPECT: 0 rows)
select privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'saved_items' and grantee = 'anon';

-- 4. authenticated grants (EXPECT: exactly SELECT, INSERT, DELETE — no UPDATE)
select privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'saved_items' and grantee = 'authenticated'
order by privilege_type;

-- 5. Unique dedupe index present (EXPECT: 1 row)
select indexname
from pg_indexes
where schemaname = 'public' and tablename = 'saved_items'
  and indexname = 'saved_items_unique_per_buyer_idx';

-- 6. Check constraints — price non-negative + source whitelist (EXPECT: 2 rows)
select conname
from pg_constraint
where conrelid = 'public.saved_items'::regclass and contype = 'c'
order by conname;

-- 7. updated_at trigger present (EXPECT: 1 row)
select tgname
from pg_trigger
where tgrelid = 'public.saved_items'::regclass and not tgisinternal;

-- 8. FK on user_id cascades on delete (EXPECT: user_id -> users, on delete 'c')
select conname, confdeltype
from pg_constraint
where conrelid = 'public.saved_items'::regclass and contype = 'f';

-- =============================================================
-- 9. MANUAL RLS ISOLATION (run separately with two buyer sessions):
--    a) Buyer A inserts a saved_item -> succeeds, visible to A only.
--    b) Buyer B selects -> does NOT see A's row.
--    c) Buyer B inserts with user_id = A's id -> RLS with-check denies.
--    d) anon select -> permission denied (zero grants).
-- =============================================================
