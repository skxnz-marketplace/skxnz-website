-- SKXNZ catalog relation read verification (READ ONLY).
-- Run after applying 0015_harden_catalog_relation_reads.sql. Run each role
-- block separately in SQL Editor so a failed relation is isolated.

-- 1. Required catalog relation grants and RLS.
with targets(table_name) as (
  values ('products'), ('brands'), ('categories'), ('product_variants'), ('product_images')
)
select
  targets.table_name,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  case when c.oid is not null then has_table_privilege('anon', c.oid, 'select') end as anon_select_granted,
  case when c.oid is not null then has_table_privilege('authenticated', c.oid, 'select') end as authenticated_select_granted
from targets
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = targets.table_name
order by targets.table_name;

-- 2. SELECT policies. Seller policies must be authenticated-only and no catalog
-- SELECT policy may directly reference public.users.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  (coalesce(qual, '') ilike '%public.users%' or coalesce(with_check, '') ilike '%public.users%') as directly_references_users
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'brands', 'categories', 'product_variants', 'product_images')
  and cmd in ('SELECT', 'ALL')
order by tablename, policyname;

-- 3. Anonymous runtime proof: product visibility remains ACTIVE-only.
begin read only;
set local role anon;
select status::text, count(*) as visible_rows
from public.products
group by status::text
order by status::text;
rollback;

-- 4. Anonymous runtime proof: variants from ACTIVE parents only.
begin read only;
set local role anon;
select
  count(*) filter (where p.status::text = 'ACTIVE') as active_parent_variants,
  count(*) filter (where p.status::text <> 'ACTIVE') as non_active_parent_variants
from public.product_variants v
join public.products p on p.id = v.product_id;
rollback;

-- 5. Anonymous runtime proof: images from ACTIVE parents only.
begin read only;
set local role anon;
select
  count(*) filter (where p.status::text = 'ACTIVE') as active_parent_images,
  count(*) filter (where p.status::text <> 'ACTIVE') as non_active_parent_images
from public.product_images i
join public.products p on p.id = i.product_id;
rollback;

-- 6. Brands/categories remain public-storefront-readable under anon.
begin read only;
set local role anon;
select
  exists(select 1 from public.brands where is_active) as active_brands_readable,
  exists(select 1 from public.categories where is_active) as active_categories_readable;
rollback;

-- 7. User table remains unavailable to anon. This reads metadata only.
select
  has_table_privilege('anon', 'public.users', 'select') as anon_users_select_granted,
  coalesce((
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'users'
  ), false) as users_rls_enabled;
