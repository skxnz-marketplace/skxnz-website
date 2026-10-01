-- SKXNZ: let anonymous visitors read active brands and categories again.
--
-- Root cause (docs/engineering/DATA_ARCHITECTURE_AUDIT_2026-10-01.md §8):
--   "brands: admin can select all" and "categories: admin can select all" (0002)
--   apply to role PUBLIC and run an inline subquery on public.users. Postgres
--   evaluates every permissive SELECT policy, so an anon read of brands or
--   categories runs that subquery with anon's privileges. anon has no SELECT on
--   public.users, so the whole read fails with
--     42501 permission denied for table users
--   This is the same defect 0013 fixed for products and 0015 fixed for
--   product_variants / product_images; brands and categories were missed.
--
-- Fix: the 0013 pattern. Admin SELECT becomes authenticated-only and uses the
-- existing SECURITY DEFINER helper public.is_admin() (0003), so policy
-- evaluation never reads public.users with the caller's privileges.
--
-- Does NOT grant anon anything on public.users, does NOT touch the admin
-- INSERT/UPDATE/DELETE policies (not evaluated for reads; anon holds no write
-- grants on these tables), and does NOT change any other table.

-- 1. Admin SELECT: authenticated + is_admin() instead of an inline users subquery.
drop policy if exists "brands: admin can select all" on public.brands;
create policy "brands: admin can select all"
  on public.brands
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "categories: admin can select all" on public.categories;
create policy "categories: admin can select all"
  on public.categories
  for select
  to authenticated
  using (public.is_admin());

-- 2. Record and collapse untracked live drift (found 2026-10-01, in no migration):
--      "brands: active public select"      for select to anon, authenticated using (is_active = true)
--      "categories: active public select"  for select to anon, authenticated using (is_active = true)
--    Both duplicate the tracked "<table>: public can select active" policies
--    (0002, role PUBLIC, same predicate), so dropping them changes no access.
--    To restore exactly: re-run the two definitions above as CREATE POLICY.
drop policy if exists "brands: active public select" on public.brands;
drop policy if exists "categories: active public select" on public.categories;

-- 3. Record the existing live read grants (no-op on the live project; makes a
--    fresh database match production). Row access stays governed by RLS.
grant select on table public.brands to anon, authenticated;
grant select on table public.categories to anon, authenticated;

-- Resulting SELECT policies on each table:
--   "<table>: public can select active"  PUBLIC          using (is_active = true)
--   "<table>: admin can select all"      authenticated   using (public.is_admin())
