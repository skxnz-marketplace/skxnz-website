---
title: Slice 3 — Supabase Recursive Admin RLS Fix
date: 2026-07-02
tags:
  - report
  - slice
  - security
  - supabase
  - rls
  - migration
type: report
agent: skxnz-backend-auditor
status: complete
app_source_touched: supabase/migrations/0003_fix_admin_rls_helper.sql
migration_applied: false
commit: false
push: false
pr: false
---

# Slice 3 — Supabase Recursive Admin RLS Fix

> [!abstract] Scope
> Single new migration `supabase/migrations/0003_fix_admin_rls_helper.sql`. Adds `public.is_admin()` and repoints the one recursive policy on `public.users`. Resolves **H1** from [[SUPABASE_SECURITY_DEEP_AUDIT]]. Not applied to live DB (manual SQL-Editor step). No seeds touched.

## Issue chosen
**H1 — recursive self-referential RLS policy** `"users: admin can select all"` on `public.users` (`0001_user_layer.sql:184-194`). Its `using` clause runs `exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')` — a sub-select against the **same table the policy guards**. Postgres re-applies the table's SELECT policies to that inner sub-select → self-recursion / unpredictable, expensive re-evaluation. The inline "no recursion because auth.uid() short-circuits" comment is wrong: `auth.uid() = id` only short-circuits the *owner* policy; both SELECT policies are OR'd on every read of `public.users`.

## Why this was the safest first Supabase fix
- **Additive + isolated:** one new function + drop/recreate of one already-named policy. No schema/table/column change.
- **Exact names known** from `0001` (applied) — no guessing. `0001` is live; `0002` (catalog) is not yet applied, so this migration doesn't depend on or disturb it.
- **Highest severity, smallest blast radius:** eliminates the top RLS finding without touching owner/seller/catalog policies, payments, orders, or roles.
- Catalog admin policies (`0002`) query `public.users` from a **different** table → **not recursive** (only duplicated, M7) → correctly left out of this slice.

## Migration file created
`supabase/migrations/0003_fix_admin_rls_helper.sql` (new, ~1 KB).

## SQL summary
```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role::text = 'ADMIN'
  );
$$;

drop policy if exists "users: admin can select all" on public.users;
create policy "users: admin can select all"
  on public.users for select
  using ( public.is_admin() );
```

## RLS / security reasoning
- **SECURITY DEFINER** → the helper reads `public.users` as the function owner, **bypassing RLS**, so calling it inside the `public.users` policy does **not** re-trigger that table's SELECT policies → recursion broken.
- **`set search_path = public`** → blocks search-path hijacking of the unqualified relation resolution inside a definer function (standard hardening).
- **STABLE** → constant within a statement (planner-friendly, no per-row surprise).
- **Anon-safe** → `auth.uid()` is null for anon → sub-select returns no row → `false`.
- **Enum-safe** → `role::text = 'ADMIN'` compares the `public.user_role` enum as text.
- **No secret / service-role exposure** → no params, returns only a boolean about the caller; no `service_role` key or admin client logic referenced.
- **RLS stays enabled**; no broad/`public`-select grant introduced. Default `EXECUTE` on the function (available to `authenticated`/`anon`) is required so the policy can call it — it leaks nothing beyond the caller's own admin boolean.

## Policies affected
- `"users: admin can select all"` on `public.users` — dropped + recreated with `using ( public.is_admin() )`. Same name, same intent (admins read all user rows), non-recursive.

## Policies NOT touched
- `"users: owner can select"`, `"users: owner can update"` (`public.users`).
- All `user_profiles` and `addresses` policies (`0001`).
- **All catalog policies** in `0002` (brands/categories/products/product_variants/product_images) — not recursive; optional `is_admin()` refactor deferred (see migration note).

## Verification SQL (run in Supabase SQL Editor after applying 0003)
```sql
-- 1. Helper exists, is SECURITY DEFINER, has pinned search_path
select p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';
-- expect: prosecdef = true, proconfig = {search_path=public}

-- 2. Policy now uses the helper (no self-select on public.users)
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.users'::regclass
  and polname = 'users: admin can select all';
-- expect using_expr: is_admin()

-- 3. Behaviour: as a normal (non-admin) signed-in user, this returns
--    only their own row; as an ADMIN it returns all rows. No error /
--    no "infinite recursion detected in policy" message.
select count(*) from public.users;
```

## Manual Supabase dashboard steps
1. Supabase → **SQL Editor** → New query.
2. Paste the full contents of `0003_fix_admin_rls_helper.sql`. Run once (idempotent — safe to re-run).
3. Run the three verification queries above.
4. Confirm no `infinite recursion detected in policy for relation "users"` error appears for `public.users` reads.

## Risks left
- **Migration not applied** — this slice only authors the SQL; owner must run it in the SQL Editor (per migration header). Until then H1 persists in the live DB.
- **Catalog M7 duplication** — ~20 admin sub-selects in `0002` remain (non-recursive; maintainability only). Deferred.
- **H2 (paise vs rupees)** and **H3 (`.env.example` drift)** untouched — separate slices.
- Function default `EXECUTE` to `public` is intentional and safe; if org policy requires least-privilege, a later slice can `revoke ... from public` and `grant execute to authenticated, anon` (must keep both or the RLS policy fails).

## Forbidden files touched
- **No.** Only `supabase/migrations/0003_fix_admin_rls_helper.sql`. No `app/`, `components/`, `src/`, `lib/`, `scripts/`, package/lock/config, env, or seed files.

## Commit / push / PR
- No / No / No.

## Related
[[SUPABASE_SECURITY_DEEP_AUDIT]] · [[BACKEND_ARCHITECTURE_READONLY_AUDIT]] · [[SLICE_2_AUTH_CALLBACK_REDIRECT_FIX_REPORT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
