---
title: Slice 3 Diff Review — Supabase RLS Admin Helper
date: 2026-07-02
tags:
  - report
  - review
  - diff
  - security
  - supabase
  - rls
  - pre-commit
type: diff-review
agent: skxnz-master-planner
status: complete
app_source_touched: false
migration_applied: false
commit: false
push: false
pr: false
---

# Slice 3 Diff Review — Supabase RLS Admin Helper

> [!abstract] Purpose
> Pre-commit review of new migration `0003_fix_admin_rls_helper.sql` (fixes H1 recursive RLS). SQL-only — **not applied** to live Supabase. Read-only; only this report written. **Do not commit yet.**

**Date:** 2026-07-02

## Files reviewed
- `supabase/migrations/0003_fix_admin_rls_helper.sql` (new file, +78 lines)
- [[SLICE_3_SUPABASE_RLS_ADMIN_FIX_REPORT]] (executor report)

## SQL diff summary
New migration, two statements + comments:
1. `create or replace function public.is_admin()` — `language sql`, `security definer`, `set search_path = public`, `stable`; returns `exists(select 1 from public.users where id = auth.uid() and role::text = 'ADMIN')`.
2. `drop policy if exists "users: admin can select all" on public.users;` then recreate `for select using ( public.is_admin() )`.
Plus a `comment on function` and a no-op explanatory note re: catalog policies. No other statement.

## Recursive RLS risk before
Policy `"users: admin can select all"` (`0001_user_layer.sql:184-194`) tested admin status via `exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')` — sub-select against the **same** table the policy guards. Postgres re-applies the table's SELECT policies to that inner query → self-recursion / unpredictable, costly re-evaluation (Postgres may also raise `infinite recursion detected in policy`).

## Helper / policy behavior after
- `public.is_admin()` reads `public.users` as the **function owner** (SECURITY DEFINER) → RLS bypassed inside the helper → calling it from the policy no longer re-triggers the users SELECT policies → recursion eliminated.
- Policy intent unchanged: admins can `SELECT` all user rows; non-admins fall through to `"users: owner can select"` (own row only); anon → `false`.

## Policies changed
- `"users: admin can select all"` on `public.users` — dropped + recreated with `using ( public.is_admin() )`. **Exact name match** to `0001`.

## Tables affected
- `public.users` only (policy repoint). New function `public.is_admin()` added. No table/column/type/data change.

## Safety checks passed
| Check | Verdict |
|---|---|
| Helper function safe (no params, boolean about caller only) | ✅ |
| SECURITY DEFINER used correctly (needed to break recursion) | ✅ |
| `search_path` pinned (`set search_path = public`) | ✅ |
| `auth.uid()` used safely (null → no row → false) | ✅ |
| Role comparison safe (`role::text = 'ADMIN'`, enum-safe) | ✅ |
| No service-role key / admin-client logic referenced | ✅ |
| No secrets | ✅ |
| RLS not disabled (no `disable row level security`) | ✅ |
| No broad public access added (no `to public`/`using(true)`) | ✅ |
| Only destructive op = `drop policy if exists` on the **verified** policy name | ✅ |
| Policy + table names match existing migrations | ✅ (`0001`) |
| No catalog/payment/order/schema mixing | ✅ (catalog left untouched, noted only) |
| Small + isolated | ✅ (78 lines, 2 statements) |
| Idempotent | ✅ (`create or replace` + `drop if exists`/create) |

## Risks left
- **Not applied** — H1 persists in live DB until owner runs `0003` in Supabase SQL Editor.
- **Ordering:** `0003` depends only on `public.users` (from `0001`, applied) — **not** on `0002`. Safe to apply even though `0002` (catalog) is still unapplied.
- **Function `EXECUTE` grant:** default `public` execute is intentional (RLS policy must call it) and safe; a least-privilege tightening (`revoke from public` + `grant to authenticated, anon`) is an optional later hardening — must keep both roles or the policy fails.
- **Catalog M7** duplication (~20 non-recursive admin sub-selects in `0002`) deferred. H2/H3 deferred.

## Should this SQL be…
- ✅ **Committed as migration only** (source-controlled SQL).
- ✅ **Manually applied in Supabase SQL Editor later** (per migration header — never CLI/ORM).
- ❌ Not revised — SQL is correct as written.

## Manual Supabase application steps (later, by owner)
1. Supabase → SQL Editor → New query.
2. Paste full `0003_fix_admin_rls_helper.sql`, run once (idempotent).
3. Run verification SQL below.
4. Confirm no `infinite recursion detected in policy for relation "users"`.

## Verification SQL
```sql
select proname, prosecdef, proconfig from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'is_admin';
-- expect prosecdef = t, proconfig = {search_path=public}

select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.users'::regclass
  and polname = 'users: admin can select all';
-- expect using_expr: is_admin()

select count(*) from public.users;  -- no recursion error
```

## Safe to commit
> [!success] Yes — migration only, not applied
> SQL is correct, minimal, isolated, idempotent, and matches verified names. Commit the file; live application stays a separate manual owner step.

## Exact files recommended for commit
```
supabase/migrations/0003_fix_admin_rls_helper.sql
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_3_SUPABASE_RLS_ADMIN_FIX_REPORT.md
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_3_DIFF_REVIEW.md
```
> [!danger] Explicit-path staging only
> Stage each path by name. Do **not** `git add -A` / `git add .` — `0002`, seeds, verification, and ~28 other pre-existing dirty files must stay out.

## Exact commit message
```
fix(rls): add is_admin() helper and de-recurse public.users admin policy

New migration 0003. Adds SECURITY DEFINER public.is_admin() (pinned
search_path, STABLE, enum-safe role check) and repoints the
"users: admin can select all" policy to use it, removing the
self-referential sub-select on public.users (H1 in
SUPABASE_SECURITY_DEEP_AUDIT).

Migration authored only — apply manually in Supabase SQL Editor.
No schema/catalog/seed/secret changes. RLS stays enabled.
```

---

## Related
[[SLICE_3_SUPABASE_RLS_ADMIN_FIX_REPORT]] · [[SUPABASE_SECURITY_DEEP_AUDIT]] · [[SLICE_2_DIFF_REVIEW]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
