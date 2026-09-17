-- =============================================================
-- SKXNZ — Slice 2A verification queries
-- Run in Supabase SQL Editor after migration + seed. Read-only.
-- =============================================================

-- 1. Tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('brands', 'categories', 'products', 'product_variants', 'product_images')
order by table_name;

-- 2. RLS enabled on each catalog table
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('brands', 'categories', 'products', 'product_variants', 'product_images')
order by relname;

-- 3. Policies exist per table
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('brands', 'categories', 'products', 'product_variants', 'product_images')
order by tablename, policyname;

-- 4. Seed counts
select
  (select count(*) from public.brands) as brand_count,
  (select count(*) from public.categories) as category_count,
  (select count(*) from public.products) as product_count,
  (select count(*) from public.product_variants) as variant_count,
  (select count(*) from public.product_images) as image_count;

-- 5. Active products query works
select id, slug, name, status, price_inr
from public.products
where status = 'ACTIVE'
order by created_at desc;

-- 6. Variants/images join for an active product
select p.slug, v.sku, v.size, v.color, v.stock_quantity
from public.products p
join public.product_variants v on v.product_id = p.id
where p.status = 'ACTIVE'
order by p.slug;

select p.slug, i.url, i.sort_order
from public.products p
join public.product_images i on i.product_id = p.id
where p.status = 'ACTIVE'
order by p.slug;
