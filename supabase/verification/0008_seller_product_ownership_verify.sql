-- =============================================================
-- SKXNZ 0008 — SELLER PRODUCT OWNERSHIP VERIFICATION (D5-4)
--
-- READ-FIRST. Every statement in Section A is a pure SELECT and
-- mutates NOTHING. Run it in the Supabase SQL Editor to learn who
-- actually owns the live products before deciding anything.
--
-- Section B is OPERATOR OPTIONAL and stays fully commented out. It
-- is NOT run by default and must never be pasted blindly — it only
-- exists to document the exact, minimal, reversible steps to hand a
-- real non-admin SELLER ownership of a test product.
--
-- This file applies NO migration and creates NO fake brand/product.
-- Ownership model (confirmed from code + migrations):
--   public.products.seller_id  uuid -> public.users(id)
--   Seller RLS (0004): seller may insert/update own DRAFT/PENDING_REVIEW
--   Admin RLS: public.is_admin() manages all
--   Reads: getSellerProductsWithRelations() filters seller_id = auth.uid()
--   Orders: getSellerOrderLines() filters order_items by own product ids
-- =============================================================


-- =============================================================
-- SECTION A — READ-ONLY OWNERSHIP TRUTH CHECKS
-- =============================================================

-- A1. Confirm the ownership column exists and its FK target.
--     EXPECT: one row, column_name = seller_id, foreign table = users.
select
  kcu.column_name,
  ccu.table_name  as references_table,
  ccu.column_name as references_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name = 'products'
  and tc.constraint_type = 'FOREIGN KEY'
  and kcu.column_name = 'seller_id';

-- A2. Ownership breakdown per owning user, WITH that user's role.
--     This is the key check: it shows whether live products are owned
--     by an ADMIN account or a real non-admin SELLER.
--     EXPECT (current live state): the seeded/live products are owned by
--     info@skxnz.com whose role is ADMIN (the D4-7 overlap WARN). A healthy
--     marketplace should also show at least one owner_role = SELLER row.
select
  p.seller_id,
  u.email,
  u.role                                   as owner_role,
  count(*)                                 as total_products,
  count(*) filter (where p.status = 'ACTIVE')          as active_products,
  count(*) filter (where p.status = 'PENDING_REVIEW')  as pending_products,
  count(*) filter (where p.status = 'REJECTED')        as rejected_products,
  count(*) filter (where p.status = 'ARCHIVED')        as archived_products
from public.products p
left join public.users u on u.id = p.seller_id
group by p.seller_id, u.email, u.role
order by total_products desc;

-- A3. Orphan check: products with no seller_id at all (would be invisible
--     to every seller dashboard AND to the seller order queue).
--     EXPECT: 0 rows. Any row here is a real ownership bug to fix.
select id, slug, name, status, created_at
from public.products
where seller_id is null
order by created_at desc;

-- A4. Real non-admin seller-owned ACTIVE product count.
--     This is the number that must be >= 1 for the marketplace to be
--     genuinely seller-driven rather than admin-demo-driven.
--     EXPECT (goal): >= 1 once a real SELLER owns a live product.
select count(*) as non_admin_seller_active_products
from public.products p
join public.users u on u.id = p.seller_id
where p.status = 'ACTIVE'
  and u.role = 'SELLER';

-- A5. All users currently holding the SELLER role (candidate owners).
--     EXPECT: your intended non-admin seller account(s) appear here. If
--     empty, no SELLER exists yet and Section B step 1 is required.
select id, email, role, created_at
from public.users
where role = 'SELLER'
order by created_at;

-- A6. Sanity: RLS is enabled on products (seller isolation depends on it).
--     EXPECT: rowsecurity = true.
select relname, relrowsecurity as rowsecurity
from pg_class
where relname = 'products' and relnamespace = 'public'::regnamespace;


-- =============================================================
-- SECTION B — OPERATOR OPTIONAL (NOT RUN BY DEFAULT)
--
-- DO NOT UNCOMMENT unless you deliberately want to hand a real,
-- existing, non-admin user ownership of an existing test product.
-- These steps mutate ownership/role of REAL rows. They create no
-- fake brands or products. Run one at a time, read A2/A4 again after.
--
-- Replace the two placeholder uuids first:
--   :seller_user_id  -> an existing public.users.id to make a SELLER
--   :product_id      -> an existing public.products.id to reassign
--
-- B1. Promote an existing user to SELLER (reversible: set back to BUYER).
--     Verify the id in A5 / your auth dashboard before running.
--
--   update public.users
--     set role = 'SELLER'
--   where id = '<seller_user_id>'
--     and role <> 'ADMIN';   -- never silently downgrade an admin
--
-- B2. Reassign ONE existing product to that seller (test ownership).
--     Only do this for a product you intend that seller to truly own.
--
--   update public.products
--     set seller_id = '<seller_user_id>'
--   where id = '<product_id>';
--
-- B3. Re-run Section A2 + A4 to confirm owner_role = SELLER and
--     non_admin_seller_active_products increased.
--
-- ROLLBACK NOTES:
--   - B1 reverse: update public.users set role = 'BUYER' where id = '<seller_user_id>';
--   - B2 reverse: update public.products set seller_id = '<original_owner_id>' where id = '<product_id>';
-- =============================================================
