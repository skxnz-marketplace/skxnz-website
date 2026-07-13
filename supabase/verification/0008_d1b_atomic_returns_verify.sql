-- D5-A post-apply verification for corrected 0008 (read-only).
select column_name, data_type from information_schema.columns where table_schema='public' and table_name='return_request_items' and column_name='reason';
select p.oid::regprocedure, p.prosecdef, p.proconfig from pg_proc p where p.oid='public.create_return_request_atomic(uuid,text,text,jsonb)'::regprocedure;
select grantee, privilege_type from information_schema.routine_privileges where routine_schema='public' and routine_name='create_return_request_atomic';
