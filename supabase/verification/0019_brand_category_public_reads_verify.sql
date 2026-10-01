-- SKXNZ brand/category public read verification (READ ONLY).
-- Run after applying 0019_fix_brand_category_public_reads.sql.

-- 1. SELECT policies: no brand/category SELECT policy may reference public.users
--    directly, and the admin policy must be authenticated-only via is_admin().
select tablename, policyname, roles, cmd,
       qual ilike '%users%' and qual not ilike '%is_admin()%' as references_users_directly
from pg_policies
where schemaname = 'public' and tablename in ('brands', 'categories') and cmd = 'SELECT'
order by tablename, policyname;
-- Expect exactly two rows per table:
--   "<t>: admin can select all"     {authenticated}  references_users_directly = false
--   "<t>: public can select active" {public}         references_users_directly = false

-- 2. Grants: anon/authenticated can read the catalogue but anon still cannot read users.
select c.relname,
       has_table_privilege('anon', c.oid, 'select')          as anon_select,
       has_table_privilege('authenticated', c.oid, 'select') as authenticated_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('brands', 'categories', 'users')
order by c.relname;
-- Expect brands/categories: true/true; users: anon_select = false.

-- 3. Behaviour (Data API): an anonymous GET of
--      /rest/v1/brands?select=id&is_active=eq.true
--      /rest/v1/categories?select=id&is_active=eq.true
--    must return 200 with rows, and /rest/v1/users must still return 42501.
