-- SKXNZ public catalog grant verification (READ ONLY).
-- Run after applying 0012_catalog_public_read_grants.sql in authorized SQL
-- Editor. This transaction changes no schema, data, grants, policies, or roles.

-- 1. Required grants and RLS. Products must be selectable by both public roles;
-- user-table output is evidence only. Do not infer a users revoke from it.
with targets(table_name) as (
  values ('products'), ('brands'), ('categories'), ('product_variants'), ('product_images'), ('users')
)
select
  targets.table_name,
  to_regclass(format('public.%I', targets.table_name)) is not null as exists,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  case when c.oid is not null then has_table_privilege('anon', c.oid, 'select') end as anon_select_granted,
  case when c.oid is not null then has_table_privilege('authenticated', c.oid, 'select') end as authenticated_select_granted
from targets
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = targets.table_name
order by targets.table_name;

-- 2. Exact public product policy. It must remain narrow: ACTIVE/published only.
select policyname, roles, cmd, qual as using_expression, with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and cmd in ('SELECT', 'ALL')
order by policyname;

-- 3. Catalog policies must not directly require public.users for public reads.
select tablename, policyname, roles, cmd, qual as using_expression, with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'brands', 'categories', 'product_variants', 'product_images')
  and cmd in ('SELECT', 'ALL')
  and (
    coalesce(qual, '') ilike '%public.users%'
    or coalesce(with_check, '') ilike '%public.users%'
  )
order by tablename, policyname;

-- 4. Effective anonymous catalogue read. No row values are returned. Active
-- must be visible when active records exist; all non-ACTIVE records must remain
-- invisible. This runs under the anon database role, not service role.
begin read only;
set local role anon;
select
  exists(select 1 from public.products where status::text = 'ACTIVE') as anon_can_read_active_products,
  exists(select 1 from public.products where status::text <> 'ACTIVE') as anon_can_read_non_active_products,
  exists(select 1 from public.brands where is_active) as anon_can_read_active_brands,
  exists(select 1 from public.categories where is_active) as anon_can_read_active_categories,
  exists(select 1 from public.product_variants) as anon_can_read_catalog_variants,
  exists(select 1 from public.product_images) as anon_can_read_catalog_images;
rollback;

-- 5. Effective authenticated catalogue read with no user identity supplied.
-- Public product policy must allow this same ACTIVE-only catalogue result.
begin read only;
set local role authenticated;
select
  exists(select 1 from public.products where status::text = 'ACTIVE') as authenticated_can_read_active_products,
  exists(select 1 from public.products where status::text <> 'ACTIVE') as authenticated_can_read_non_active_products,
  exists(select 1 from public.brands where is_active) as authenticated_can_read_active_brands,
  exists(select 1 from public.categories where is_active) as authenticated_can_read_active_categories,
  exists(select 1 from public.product_variants) as authenticated_can_read_catalog_variants,
  exists(select 1 from public.product_images) as authenticated_can_read_catalog_images;
rollback;

-- 6. User privacy check. This intentionally does not SELECT user rows. The
-- output tells the operator whether either role has table privilege; RLS policy
-- output above must still restrict authenticated users to self/admin rows.
select
  has_table_privilege('anon', 'public.users', 'select') as anon_users_select_granted,
  has_table_privilege('authenticated', 'public.users', 'select') as authenticated_users_select_granted,
  coalesce((
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'users'
  ), false) as users_rls_enabled;
