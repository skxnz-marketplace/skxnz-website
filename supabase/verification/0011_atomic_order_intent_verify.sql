-- D5-A post-apply 0011 verification (read-only).
select column_name,data_type from information_schema.columns where table_schema='public' and table_name='orders' and column_name in ('idempotency_key','idempotency_fingerprint');
select indexname,indexdef from pg_indexes where schemaname='public' and tablename='orders' and indexname='orders_buyer_idempotency_key_unique';
select p.oid::regprocedure,p.prosecdef,p.proconfig,pg_get_function_result(p.oid) from pg_proc p where p.oid='public.create_order_intent_atomic(jsonb,uuid,text,uuid)'::regprocedure;
select grantee,privilege_type from information_schema.routine_privileges where routine_schema='public' and routine_name='create_order_intent_atomic';
