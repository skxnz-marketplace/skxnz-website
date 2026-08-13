-- SKXNZ public catalog permission diagnostic (READ ONLY).
-- Run in the authorized Supabase SQL Editor. This file never changes schema,
-- grants, policies, data, roles, or session authorization.

-- 1. Required relations: existence, kind, RLS, and Data API table grants.
with targets(table_name) as (
  values ('products'), ('users'), ('brands'), ('categories'),
         ('product_variants'), ('product_images')
)
select
  targets.table_name,
  to_regclass(format('public.%I', targets.table_name)) is not null as exists,
  case c.relkind
    when 'r' then 'table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    else coalesce(c.relkind::text, 'missing')
  end as relation_kind,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as rls_forced,
  case when c.oid is not null then has_table_privilege('anon', c.oid, 'select') end as anon_select_granted,
  case when c.oid is not null then has_table_privilege('authenticated', c.oid, 'select') end as authenticated_select_granted
from targets
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = targets.table_name
order by targets.table_name;

-- 2. Exact SELECT/ALL policies. `qual` is USING; `with_check` is WITH CHECK.
-- Review public/anon policies for narrow ACTIVE or published catalog predicates.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'users', 'brands', 'categories', 'product_variants', 'product_images')
order by tablename, cmd, policyname;

-- 3. Product policies that directly mention public.users. Any SELECT/ALL hit can
-- explain a catalog error if anon/authenticated lacks SELECT on public.users.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename = 'products'
  and (
    coalesce(qual, '') ilike '%public.users%'
    or coalesce(with_check, '') ilike '%public.users%'
  )
order by cmd, policyname;

-- 4. Other catalog policy expressions that reach public.users.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('brands', 'categories', 'product_variants', 'product_images')
  and (
    coalesce(qual, '') ilike '%public.users%'
    or coalesce(with_check, '') ilike '%public.users%'
  )
order by tablename, cmd, policyname;

-- 5. User privacy must remain closed to public roles. Both values should be false.
select
  has_table_privilege('anon', 'public.users', 'select') as anon_users_select_granted,
  has_table_privilege('authenticated', 'public.users', 'select') as authenticated_users_select_granted,
  coalesce((
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'users'
  ), false) as users_rls_enabled;

-- 6. Views that reference catalog relations. Views can change RLS behavior;
-- security_invoker should be true for public-facing views on Postgres 15+.
select
  c.relname as view_name,
  case c.relkind when 'v' then 'view' when 'm' then 'materialized view' end as view_kind,
  coalesce((c.reloptions::text[] @> array['security_invoker=true']), false) as security_invoker,
  has_table_privilege('anon', c.oid, 'select') as anon_select_granted,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_select_granted,
  pg_get_viewdef(c.oid, true) as definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('v', 'm')
  and pg_get_viewdef(c.oid, true) ~* '\m(products|brands|categories|product_variants|product_images)\M'
order by c.relname;

-- 7. Public functions whose stored source mentions catalog relations. Review
-- SECURITY DEFINER functions separately; this output does not execute them.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute_granted,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute_granted,
  p.prosrc as stored_source
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ~* '\m(products|brands|categories|product_variants|product_images)\M'
order by p.proname, arguments;

-- 8. Structural verdict only; it does not bypass RLS or execute a catalog read.
-- `anon_can_structurally_read_active_catalog` is true only when products exists,
-- RLS is enabled, anon has SELECT, and an anon/public SELECT/ALL policy contains
-- an ACTIVE or published predicate. Confirm result with an anonymous REST smoke.
with product_relation as (
  select c.oid, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'products'
), public_catalog_policy as (
  select exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'products'
      and p.cmd in ('SELECT', 'ALL')
      and ('anon' = any(p.roles) or 'public' = any(p.roles))
      and coalesce(p.qual, '') ~* '(status[[:space:]]*=[[:space:]]*''ACTIVE''|is_active[[:space:]]*=[[:space:]]*true|published)'
  ) as has_narrow_public_product_policy
)
select
  exists(select 1 from product_relation) as products_exists,
  coalesce((select relrowsecurity from product_relation), false) as products_rls_enabled,
  coalesce((select has_table_privilege('anon', oid, 'select') from product_relation), false) as anon_products_select_granted,
  has_narrow_public_product_policy,
  coalesce((select relrowsecurity from product_relation), false)
    and coalesce((select has_table_privilege('anon', oid, 'select') from product_relation), false)
    and has_narrow_public_product_policy as anon_can_structurally_read_active_catalog,
  not has_table_privilege('anon', 'public.users', 'select')
    and not has_table_privilege('authenticated', 'public.users', 'select') as users_remain_non_public
from public_catalog_policy;
