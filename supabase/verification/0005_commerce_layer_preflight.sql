-- =============================================================
-- SKXNZ — Slice 5 PREFLIGHT (D4-7). Run BEFORE 0005_commerce_layer.sql.
-- Read-only. Confirms the live schema matches what 0005 + the app assume.
-- Run each query in the Supabase SQL Editor and compare to EXPECT comments.
-- If any EXPECT fails, STOP and report — do not apply 0005 yet.
-- =============================================================

-- 1. Dependency objects 0005 needs must already exist.
-- EXPECT: 3 rows -> set_updated_at (function), is_admin (function),
--         user_role (enum type 'e'). Missing is_admin => apply 0003 first.
select 'set_updated_at' as needs, to_regprocedure('public.set_updated_at()') is not null as present
union all
select 'is_admin', to_regprocedure('public.is_admin()') is not null
union all
select 'user_role_enum',
  exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'user_role');

-- 2. ID column types the FKs + app rely on.
-- EXPECT: every row data_type = 'uuid'.
--   public.users.id, public.user_profiles.user_id, public.addresses.user_id,
--   public.products.id, public.products.seller_id.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'users'          and column_name = 'id')
    or (table_name = 'user_profiles' and column_name = 'user_id')
    or (table_name = 'addresses'     and column_name = 'user_id')
    or (table_name = 'products'      and column_name in ('id', 'seller_id'))
  )
order by table_name, column_name;

-- 3. Tables the app reads/joins against must exist.
-- EXPECT: users, addresses, products, product_variants, brands (5 rows).
--   addresses -> createOrderIntent contact/shipping snapshot source.
--   products.seller_id -> seller order-line RLS + read-seller-orders.
--   No separate store/seller-mapping table is used; seller_id is the link.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('users', 'addresses', 'products', 'product_variants', 'brands')
order by table_name;

-- 4. products.price_inr is whole rupees (money helper multiplies by 100).
-- EXPECT: numeric or integer. If already paise, the app's rupees->paise
--         conversion would be wrong — STOP and flag.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'products'
  and column_name in ('price_inr', 'compare_at_price_inr');

-- 5. Commerce tables must NOT already exist (fresh apply).
-- EXPECT: 0 rows. If any exist, 0005 is idempotent (create ... if not
--         exists / drop policy if exists) and can be safely re-run, but
--         confirm you are not colliding with an unrelated table first.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'orders', 'order_items', 'order_events',
    'support_tickets', 'support_ticket_messages',
    'return_requests', 'return_request_items'
  )
order by table_name;

-- 6. At least one ACTIVE product + variant with stock exists to smoke-test
--    createOrderIntent after apply.
-- EXPECT: active_products >= 1 and variants_with_stock >= 1 (else seed one
--         before the app smoke test — do NOT invent orders).
select
  (select count(*) from public.products where status = 'ACTIVE') as active_products,
  (select count(*) from public.product_variants where is_active and stock_quantity > 0) as variants_with_stock;
