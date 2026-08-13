-- SKXNZ catalog relations + admin product policy verification (READ ONLY).
-- Run sections 1-2 first. Run each section in 3 separately in SQL Editor so a
-- missing grant is reported for that one relation without hiding later checks.

-- 1. Relation presence, RLS, and role grants.
with targets(table_name) as (
  values ('products'), ('brands'), ('categories'), ('product_variants'), ('product_images')
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

-- 2. Every catalog SELECT/ALL policy. No products SELECT/ALL expression may
-- directly mention public.users; admin read must call public.is_admin().
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression,
  (coalesce(qual, '') ilike '%public.users%' or coalesce(with_check, '') ilike '%public.users%') as directly_references_users
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'brands', 'categories', 'product_variants', 'product_images')
  and cmd in ('SELECT', 'ALL', 'DELETE')
order by tablename, cmd, policyname;

-- 3a. Anonymous product query shape used by /, /shop, /product/[slug], /search.
begin read only;
set local role anon;
select status::text, count(*) as visible_rows
from public.products
group by status::text
order by status::text;
rollback;

-- 3b. Anonymous brand query shape used by /, /brands, and product relations.
begin read only;
set local role anon;
select is_active, count(*) as visible_rows
from public.brands
group by is_active
order by is_active;
rollback;

-- 3c. Anonymous category query shape used by /shop and product relations.
begin read only;
set local role anon;
select is_active, count(*) as visible_rows
from public.categories
group by is_active
order by is_active;
rollback;

-- 3d. Anonymous active-variant relation shape used by product detail/shop.
begin read only;
set local role anon;
select v.is_active, count(*) as visible_rows
from public.product_variants v
where exists (
  select 1 from public.products p
  where p.id = v.product_id and p.status::text = 'ACTIVE'
)
group by v.is_active
order by v.is_active;
rollback;

-- 3e. Anonymous image relation shape used by product detail/shop.
begin read only;
set local role anon;
select count(*) as visible_rows
from public.product_images i
where exists (
  select 1 from public.products p
  where p.id = i.product_id and p.status::text = 'ACTIVE'
);
rollback;

-- 4. User privacy remains RLS-protected; no user rows are selected.
select
  has_table_privilege('anon', 'public.users', 'select') as anon_users_select_granted,
  has_table_privilege('authenticated', 'public.users', 'select') as authenticated_users_select_granted,
  coalesce((
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'users'
  ), false) as users_rls_enabled;
