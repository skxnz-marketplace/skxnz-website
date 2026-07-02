-- =============================================================
-- SKXNZ — Slice 3: Admin RLS helper + recursion fix
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
--
-- Fixes H1 from SUPABASE_SECURITY_DEEP_AUDIT: the policy
-- "users: admin can select all" on public.users used a sub-select
-- AGAINST public.users itself. Because Postgres re-applies the
-- table's SELECT policies to that inner sub-select, the admin check
-- is self-referential -> recursion / unpredictable, expensive
-- re-evaluation. The old inline comment ("no recursion because
-- auth.uid() short-circuits") is incorrect: auth.uid() = id only
-- short-circuits the OWNER policy; both SELECT policies are OR'd for
-- every read.
--
-- Fix: a SECURITY DEFINER helper public.is_admin() that reads
-- public.users as the function owner (bypassing RLS), so calling it
-- inside the policy does NOT re-trigger the users SELECT policies.
-- =============================================================


-- =============================================================
-- 1. HELPER: public.is_admin()
--    Returns true iff the current authenticated user has role ADMIN.
--    - SECURITY DEFINER: runs as owner, bypasses RLS on public.users,
--      which is what breaks the recursion.
--    - set search_path = public: prevents search-path hijacking of
--      an unqualified object inside a definer function.
--    - STABLE: result is constant within one statement.
--    - Returns false for anon (auth.uid() is null -> no row).
--    - role compared as text so it is safe against the user_role enum.
--    - No parameters, no service-role logic, leaks nothing beyond a
--      boolean about the caller themselves.
-- =============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role::text = 'ADMIN'
  );
$$;

comment on function public.is_admin() is
  'True iff the current authenticated user has role ADMIN. SECURITY DEFINER so it can be called from RLS policies on public.users without self-recursion.';


-- =============================================================
-- 2. REPOINT the one recursive policy on public.users
--    Exact existing policy name (from 0001_user_layer.sql:184-194).
--    Same name + same intent (admins can SELECT all user rows),
--    now via the non-recursive helper. Idempotent: drop-if-exists
--    then recreate. RLS stays enabled; no broad grants added.
-- =============================================================

drop policy if exists "users: admin can select all" on public.users;

create policy "users: admin can select all"
  on public.users
  for select
  using ( public.is_admin() );

-- =============================================================
-- NOTE (out of scope this slice, no change made):
-- The catalog admin policies in 0002_catalog_layer.sql query
-- public.users from a DIFFERENT table, so they are NOT recursive.
-- They only duplicate the admin sub-select ~20x (audit M7). They
-- can OPTIONALLY be refactored to `using ( public.is_admin() )`
-- for maintainability once 0002 is applied — deferred to a later
-- slice so this migration stays minimal and isolated.
-- =============================================================
