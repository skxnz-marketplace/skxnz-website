-- =============================================================
-- SKXNZ - Seller product lifecycle 0004 verification queries
-- Run in Supabase SQL Editor after applying 0004. Read-only.
-- =============================================================

-- 1. Enum labels for product_status
-- Expected order:
-- DRAFT, ACTIVE, ARCHIVED, PENDING_REVIEW, REJECTED
select e.enumlabel as product_status
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'product_status'
order by e.enumsortorder;

-- 2. RLS enabled on lifecycle tables
-- Expected: relrowsecurity = true for all three.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('products', 'product_variants', 'product_images')
order by relname;

-- 3. Full policy dump for lifecycle tables
-- Expected: seller draft/pending policies, public ACTIVE select policies,
-- and admin is_admin policies are present.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'product_variants', 'product_images')
order by tablename, policyname;

-- 4a. Targeted assert: product seller insert/update checks include DRAFT and PENDING_REVIEW.
-- Expected: both rows return true for has_draft and has_pending_review.
select
  policyname,
  with_check like '%DRAFT%' as has_draft,
  with_check like '%PENDING_REVIEW%' as has_pending_review
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and policyname in (
    'products: seller can insert own draft or pending',
    'products: seller can update own draft or pending'
  )
order by policyname;

-- 4b. Targeted assert: admin policies reference public.is_admin().
-- Expected: all rows have uses_is_admin = true.
select
  tablename,
  policyname,
  cmd,
  coalesce(qual, '') like '%is_admin%' or coalesce(with_check, '') like '%is_admin%' as uses_is_admin
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'product_variants', 'product_images')
  and policyname in (
    'products: admin can insert',
    'products: admin can update all',
    'product_variants: admin can manage all',
    'product_images: admin can manage all'
  )
order by tablename, policyname;

-- 4c. Targeted assert: public product select still only exposes ACTIVE.
-- Expected: public_products_uses_active = true.
select
  policyname,
  qual like '%ACTIVE%' as public_products_uses_active
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and policyname = 'products: public can select active';

-- 5a. Stale-policy check: old products seller update policy is gone.
-- Expected: stale_policy_count = 0.
select count(*) as stale_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and policyname = 'products: seller can update own';

-- 5b. Stale-policy check: seller policies no longer embed the old admin OR-branch.
-- Expected: seller_policy_with_admin_role_branch_count = 0.
select count(*) as seller_policy_with_admin_role_branch_count
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'product_variants', 'product_images')
  and policyname like '%seller%'
  and (
    coalesce(qual, '') like '% or exists%ADMIN%'
    or coalesce(with_check, '') like '% or exists%ADMIN%'
  );
