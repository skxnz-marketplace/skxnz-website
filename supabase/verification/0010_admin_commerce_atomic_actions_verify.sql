-- D4-B 0010 verification (read-only; run only after operator applies 0010).
-- EXPECT: every DO block completes. This is schema/grant review only, not a
-- substitute for the multi-role, live-JWT isolation harness.
do $$
declare fn regprocedure; is_definer boolean; cfg text[]; signature text;
begin
  foreach fn in array[
    'public.admin_update_order_status_atomic(uuid,text,text)'::regprocedure,
    'public.admin_update_return_status_atomic(uuid,text,text)'::regprocedure
  ] loop
    select prosecdef, proconfig, pg_get_function_result(oid)
      into strict is_definer, cfg, signature from pg_proc where oid=fn;
    if not is_definer then
      raise exception '0010 verification: % must be SECURITY DEFINER', fn;
    end if;
    if cfg is null or not ('search_path=public, pg_temp'=any(cfg)) then
      raise exception '0010 verification: % lacks safe explicit search_path', fn;
    end if;
    if signature not like 'TABLE(%uuid%, status text)%' then
      raise exception '0010 verification: unexpected result signature for %: %', fn, signature;
    end if;
  end loop;
end $$;

-- `has_function_privilege` proves the effective grants, including PUBLIC.
do $$
declare fn regprocedure;
begin
  foreach fn in array[
    'public.admin_update_order_status_atomic(uuid,text,text)'::regprocedure,
    'public.admin_update_return_status_atomic(uuid,text,text)'::regprocedure
  ] loop
    if not has_function_privilege('authenticated', fn, 'EXECUTE')
       or has_function_privilege('anon', fn, 'EXECUTE')
       or exists (
         select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
         where p.oid=fn and acl.grantee=0 and acl.privilege_type='EXECUTE'
       ) then
      raise exception '0010 verification: execute grant mismatch for %', fn;
    end if;
  end loop;
end $$;

-- Existing checked-text statuses (not PG enum columns) and audit dependencies.
do $$
begin
  if (select count(*) from information_schema.columns where table_schema='public' and table_name='orders' and column_name in ('id','status')) <> 2
     or (select count(*) from information_schema.columns where table_schema='public' and table_name='return_requests' and column_name in ('id','order_id','status')) <> 3
     or (select count(*) from information_schema.columns where table_schema='public' and table_name='order_events' and column_name in ('order_id','event_type','message','metadata')) <> 4 then
    raise exception '0010 verification: a required resource or audit column is absent';
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_status_check')
     or not exists (select 1 from pg_constraint where conrelid='public.return_requests'::regclass and conname='return_requests_status_check') then
    raise exception '0010 verification: expected status check constraint missing';
  end if;
end $$;

select p.oid::regprocedure as function_name, p.prosecdef as security_definer,
       p.proconfig as function_config, pg_get_function_result(p.oid) as return_signature
from pg_proc p where p.oid in (
  'public.admin_update_order_status_atomic(uuid,text,text)'::regprocedure,
  'public.admin_update_return_status_atomic(uuid,text,text)'::regprocedure
) order by function_name::text;
