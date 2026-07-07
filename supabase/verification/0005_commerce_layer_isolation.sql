-- =============================================================
-- SKXNZ — Slice 5 ISOLATION test (D4-7), grid-visible results.
-- Run AFTER 0005_commerce_layer.sql has been applied and
-- 0005_commerce_layer_verify.sql has passed.
--
-- WHAT THIS ADDS: prior versions only printed PASS/FAIL/SKIP via
-- RAISE NOTICE, which the Supabase SQL Editor's Results grid does not
-- surface clearly (only the Logs/Messages panel does, easy to miss and
-- awkward to copy). This version ALSO writes every check into a temp
-- table `_isolation_results` and ends with one plain
--   select * from _isolation_results order by sort_order;
-- so the last statement's output — the thing the Results grid actually
-- shows — is a clean, copyable PASS/FAIL/SKIP/WARN table. RAISE NOTICE
-- calls are kept too (harmless, useful if you also watch the log).
--
-- WHY A RELAY VARIABLE, NOT A DIRECT INSERT: sections B/C/D/E/F/F2/G each
-- seed rows in `public.orders`/`public.order_items` and then undo them
-- with `rollback to savepoint sp_x;` so later sections see a clean baseline
-- (see the D4-7 harness-lifecycle fix for why this matters). But
-- ROLLBACK TO SAVEPOINT undoes EVERY change made after that savepoint,
-- including a results-table insert if it happened inside that scope. So
-- each block instead stashes its verdicts as JSON into a SESSION-LEVEL
-- custom GUC via `set_config(name, value, false)` — the `false`
-- (is_local) means it is NOT transactional and survives
-- ROLLBACK TO SAVEPOINT. Immediately after each `rollback to savepoint`,
-- a plain top-level statement reads that GUC and inserts the real rows
-- into `_isolation_results`, which is never itself inside a savepoint
-- scope. The GUC values are transient session settings, not database
-- rows — nothing persists once this SQL Editor session ends.
--
-- BUG HISTORY THIS FILE ALSO CARRIES FORWARD (see earlier comments were
-- collapsed for brevity, unchanged from the prior fix):
-- 1) Every section was originally its own begin/rollback transaction;
--    Supabase's pooled connection could serve the next `begin;` on a
--    different backend, dropping the session-scoped `_isolation_config`
--    temp table (42P01). Fixed: the whole script now runs inside ONE
--    outer `begin; ... rollback;`, with SAVEPOINT/ROLLBACK TO SAVEPOINT
--    for per-section cleanup instead of separate transactions.
-- 2) Every query that can legitimately fail (anon selects, cross-buyer
--    insert, PAID/payment-field insert, buyer update) is wrapped in
--    `do $$ ... exception when insufficient_privilege then ... end $$;`
--    so a caught error never aborts the batch.
--
-- This file does NOT touch supabase/migrations/0005_commerce_layer.sql,
-- and grants NOTHING to anon or extra grants to authenticated. Permission
-- denials it exercises are the intended, correct behaviour.
--
-- NO PERMANENT DATA IS LEFT BEHIND: the single outer `rollback;` at the
-- very end (after the results SELECT) discards everything — both temp
-- tables and every seed row. Run it, read/copy the grid, done.
-- =============================================================

begin;

-- =============================================================
-- CONFIG — edit this ONE insert if you need different test accounts.
-- Values below are pre-filled from the live D4-7 test run. NOTES:
-- - admin_id and seller_id are the SAME user in that data — Block G below
--   detects this and SKIPs (rather than falsely PASSes/FAILs) unless that
--   user's public.users.role is actually 'ADMIN'. Point admin_id at a real
--   ADMIN-role user for a meaningful admin test.
-- - buyer_2_id and other_seller_id are also the SAME underlying user in
--   this data. This does not invalidate F2 (it only requires
--   other_seller_id != seller_id, which holds), but if you want a fully
--   independent third identity, use a different other_seller_id.
-- =============================================================
create temp table _isolation_config (
  buyer_1_id      uuid not null,
  buyer_2_id      uuid not null,
  seller_id       uuid not null,
  other_seller_id uuid not null,
  admin_id        uuid not null,
  product_id      uuid not null
) on commit drop;

create temp table _isolation_results (
  sort_order serial,
  block_name text,
  status     text, -- PASS | FAIL | SKIP | WARN
  detail     text
) on commit drop;

insert into _isolation_config
  (buyer_1_id, buyer_2_id, seller_id, other_seller_id, admin_id, product_id)
values (
  '585102c1-e55d-427d-b0be-de7e71134dc2', -- buyer_1_id
  '39cb4363-8162-4069-8b6a-87dfb69c0afe', -- buyer_2_id
  '31e9e3aa-adbb-4063-9682-394f8d8807c1', -- seller_id
  '39cb4363-8162-4069-8b6a-87dfb69c0afe', -- other_seller_id (see note above)
  '31e9e3aa-adbb-4063-9682-394f8d8807c1', -- admin_id (see note above)
  '4d378027-572e-42b0-9357-225e34c043d0'  -- product_id (must belong to seller_id)
);

-- CONFIG sanity: exactly one config row, plus product/admin diagnostics.
-- No savepoint precedes this, so it can insert into _isolation_results
-- directly — nothing rolls it back before the final SELECT.
do $$
declare
  v_row_count int;
  cfg record;
  v_product_seller uuid;
  v_admin_role text;
begin
  select count(*) into v_row_count from _isolation_config;
  if v_row_count <> 1 then
    raise notice 'ISOLATION_RESULT: CONFIG: FAIL (_isolation_config has % rows, expected exactly 1)', v_row_count;
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG', 'FAIL', format('_isolation_config has %s rows, expected exactly 1 - fix the INSERT above', v_row_count));
    return;
  end if;

  insert into _isolation_results (block_name, status, detail)
  values ('CONFIG-row-count', 'PASS', 'exactly 1 config row');

  select * into cfg from _isolation_config limit 1;

  select seller_id into v_product_seller from public.products where id = cfg.product_id;
  if v_product_seller is distinct from cfg.seller_id then
    raise notice 'ISOLATION_RESULT: CONFIG-product-ownership: WARN (product_id belongs to seller % not configured seller %)', v_product_seller, cfg.seller_id;
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-product-ownership', 'WARN', format('product_id belongs to seller %s not configured seller %s; blocks E/F/F2 will SKIP', v_product_seller, cfg.seller_id));
  else
    raise notice 'ISOLATION_RESULT: CONFIG-product-ownership: PASS (product belongs to configured seller_id)';
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-product-ownership', 'PASS', 'product belongs to configured seller_id');
  end if;

  select role::text into v_admin_role from public.users where id = cfg.admin_id;
  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: CONFIG-admin-role: WARN (admin_id role is % not ADMIN)', coalesce(v_admin_role, 'NULL/not found');
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-role', 'WARN', format('admin_id role is %s not ADMIN; Block G will SKIP', coalesce(v_admin_role, 'NULL/not found')));
  else
    raise notice 'ISOLATION_RESULT: CONFIG-admin-role: PASS (admin_id has ADMIN role)';
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-role', 'PASS', 'admin_id has ADMIN role');
  end if;
end $$;


-- =============================================================
-- A. ANON cannot read commerce tables. No seed data -> no savepoint
-- needed; inserts into _isolation_results directly.
-- =============================================================
do $$
declare
  v_count int;
  v_table text;
begin
  foreach v_table in array array['orders','order_items','support_tickets','return_requests']
  loop
    begin
      execute 'set local role anon';
      execute format('select count(*) from public.%I', v_table) into v_count;
      if v_count = 0 then
        raise notice 'ISOLATION_RESULT: A-anon-select-%: PASS (0 rows visible to anon)', v_table;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'PASS', '0 rows visible to anon');
      else
        raise notice 'ISOLATION_RESULT: A-anon-select-%: FAIL (% rows visible to anon)', v_table, v_count;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'FAIL', format('%s rows visible to anon - DATA LEAK', v_count));
      end if;
    exception
      when insufficient_privilege then
        raise notice 'ISOLATION_RESULT: A-anon-select-%: PASS (permission denied for anon)', v_table;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'PASS', 'permission denied for anon, as expected');
    end;
    execute 'reset role';
  end loop;
end $$;


-- =============================================================
-- B. BUYER 1 sees only own orders. BUYER 2 cannot read or insert into it.
-- Seeds a row in public.orders, so it is wrapped in a savepoint. Verdicts
-- relay through a session-level GUC (see header) so they survive the
-- rollback to savepoint and get inserted into _isolation_results after.
-- =============================================================
savepoint sp_b;
do $$
declare
  cfg record;
  v_count int;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;

  insert into public.orders (
    id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot
  ) values (
    '33333333-3333-3333-3333-333333333333', cfg.buyer_1_id, 'DRAFT', 100000,
    '{"fullName":"A","phone":"0","email":"a@x.com"}'::jsonb,
    '{"line1":"1","line2":"","city":"C","state":"S","pincode":"000000","country":"India"}'::jsonb
  );

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 1 then
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: PASS';
    v_results := v_results || jsonb_build_object('name','B-buyer1-sees-own','status','PASS','detail','1 row visible');
  else
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: FAIL (got %)', v_count;
    v_results := v_results || jsonb_build_object('name','B-buyer1-sees-own','status','FAIL','detail',format('expected 1, got %s', v_count));
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_2_id, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 0 then
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: PASS';
    v_results := v_results || jsonb_build_object('name','B-buyer2-cross-read','status','PASS','detail','0 rows - cannot see buyer 1 order');
  else
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: FAIL (% rows)', v_count;
    v_results := v_results || jsonb_build_object('name','B-buyer2-cross-read','status','FAIL','detail',format('%s rows visible - CROSS-BUYER LEAK', v_count));
  end if;

  begin
    insert into public.orders (
      buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot
    ) values (
      cfg.buyer_1_id, 'DRAFT', 1, '{}'::jsonb, '{}'::jsonb
    );
    raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: FAIL (insert succeeded)';
    v_results := v_results || jsonb_build_object('name','B-buyer2-insert-as-buyer1','status','FAIL','detail','insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: PASS';
      v_results := v_results || jsonb_build_object('name','B-buyer2-insert-as-buyer1','status','PASS','detail','RLS blocked cross-buyer insert');
  end;

  execute 'reset role';
  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_b;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- C. BUYER cannot set PAID or a payment reference on insert.
-- =============================================================
savepoint sp_c;
do $$
declare
  cfg record;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'PAID', 1, '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: FAIL (insert succeeded)';
    v_results := v_results || jsonb_build_object('name','C-buyer-insert-paid','status','FAIL','detail','insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: PASS';
      v_results := v_results || jsonb_build_object('name','C-buyer-insert-paid','status','PASS','detail','RLS blocked PAID on insert');
  end;

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      payment_reference, contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'DRAFT', 1, 'fake_ref', '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: FAIL (insert succeeded)';
    v_results := v_results || jsonb_build_object('name','C-buyer-insert-payment-ref','status','FAIL','detail','insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: PASS';
      v_results := v_results || jsonb_build_object('name','C-buyer-insert-payment-ref','status','PASS','detail','RLS blocked pre-filled payment_reference');
  end;

  execute 'reset role';
  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_c;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- D. BUYER has no UPDATE path on orders (server-only status transitions).
-- =============================================================
savepoint sp_d;
do $$
declare
  cfg record;
  v_status text;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;

  insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('44444444-4444-4444-4444-444444444444', cfg.buyer_1_id, 'DRAFT', 1,
    '{}'::jsonb, '{}'::jsonb);

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  begin
    update public.orders set status = 'PAID'
    where id = '44444444-4444-4444-4444-444444444444';
    execute 'reset role';
    select status into v_status from public.orders
    where id = '44444444-4444-4444-4444-444444444444';
    if v_status = 'PAID' then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: FAIL (status became PAID)';
      v_results := v_results || jsonb_build_object('name','D-buyer-update-to-paid','status','FAIL','detail','status became PAID - BUYER MUTATED PAYMENT STATE');
    else
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS (status still %)', v_status;
      v_results := v_results || jsonb_build_object('name','D-buyer-update-to-paid','status','PASS','detail',format('update affected 0 rows; status still %s', v_status));
    end if;
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS (permission denied)';
      v_results := v_results || jsonb_build_object('name','D-buyer-update-to-paid','status','PASS','detail','permission denied - no UPDATE grant');
      execute 'reset role';
  end;

  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_d;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- E. SELLER sees only own product lines, and only on post-payment orders.
-- SKIPs (not a false PASS/FAIL) if product_id does not belong to seller_id.
-- =============================================================
savepoint sp_e;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: SKIP (product/seller mismatch)';
    v_results := v_results || jsonb_build_object('name','E-seller-sees-own-line','status','SKIP','detail','configured product_id is not owned by configured seller_id');
    v_results := v_results || jsonb_build_object('name','E-seller-no-order-access','status','SKIP','detail','same reason');
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('11111111-1111-1111-1111-111111111111', cfg.buyer_1_id, 'PAID', 100000,
      '{}'::jsonb, '{}'::jsonb);
    insert into public.order_items (order_id, product_id, product_slug,
      title_snapshot, unit_price_paise, quantity, line_total_paise)
    values ('11111111-1111-1111-1111-111111111111', cfg.product_id,
      'seed-slug', 'Seed', 100000, 1, 100000);

    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', cfg.seller_id, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.order_items where product_id = cfg.product_id;
    if v_count = 1 then
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: PASS';
      v_results := v_results || jsonb_build_object('name','E-seller-sees-own-line','status','PASS','detail','1 row visible on PAID order');
    else
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: FAIL (got %)', v_count;
      v_results := v_results || jsonb_build_object('name','E-seller-sees-own-line','status','FAIL','detail',format('expected 1, got %s', v_count));
    end if;

    select count(*) into v_count from public.orders
    where id = '11111111-1111-1111-1111-111111111111';
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: PASS';
      v_results := v_results || jsonb_build_object('name','E-seller-no-order-access','status','PASS','detail','0 rows - seller cannot read the orders table row');
    else
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: FAIL (% rows)', v_count;
      v_results := v_results || jsonb_build_object('name','E-seller-no-order-access','status','FAIL','detail',format('%s rows - seller read the parent order', v_count));
    end if;

    execute 'reset role';
  end if;

  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_e;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- F. SELLER sees NOTHING on a DRAFT/PAYMENT_PENDING order (open cart).
-- =============================================================
savepoint sp_f;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: SKIP (product/seller mismatch)';
    v_results := v_results || jsonb_build_object('name','F-seller-no-draft-access','status','SKIP','detail','configured product_id is not owned by configured seller_id');
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('22222222-2222-2222-2222-222222222222', cfg.buyer_1_id, 'DRAFT', 100000,
      '{}'::jsonb, '{}'::jsonb);
    insert into public.order_items (order_id, product_id, product_slug,
      title_snapshot, unit_price_paise, quantity, line_total_paise)
    values ('22222222-2222-2222-2222-222222222222', cfg.product_id,
      'seed-slug', 'Seed', 100000, 1, 100000);

    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', cfg.seller_id, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.order_items where product_id = cfg.product_id;
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: PASS';
      v_results := v_results || jsonb_build_object('name','F-seller-no-draft-access','status','PASS','detail','0 rows - draft-order line hidden from seller');
    else
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: FAIL (% rows)', v_count;
      v_results := v_results || jsonb_build_object('name','F-seller-no-draft-access','status','FAIL','detail',format('%s rows - seller saw a DRAFT-order line', v_count));
    end if;

    execute 'reset role';
  end if;

  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_f;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- F2. OTHER SELLER sees ZERO lines for a product they do not own.
-- =============================================================
savepoint sp_f2;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: SKIP (product/seller mismatch)';
    v_results := v_results || jsonb_build_object('name','F2-other-seller-sees-zero','status','SKIP','detail','configured product_id is not owned by configured seller_id');
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('55555555-5555-5555-5555-555555555555', cfg.buyer_1_id, 'PAID', 100000,
      '{}'::jsonb, '{}'::jsonb);
    insert into public.order_items (order_id, product_id, product_slug,
      title_snapshot, unit_price_paise, quantity, line_total_paise)
    values ('55555555-5555-5555-5555-555555555555', cfg.product_id,
      'seed-slug', 'Seed', 100000, 1, 100000);

    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', cfg.other_seller_id, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.order_items where product_id = cfg.product_id;
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: PASS';
      v_results := v_results || jsonb_build_object('name','F2-other-seller-sees-zero','status','PASS','detail','0 rows - unrelated seller sees nothing');
    else
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: FAIL (% rows)', v_count;
      v_results := v_results || jsonb_build_object('name','F2-other-seller-sees-zero','status','FAIL','detail',format('%s rows - unrelated seller saw another sellers line', v_count));
    end if;

    execute 'reset role';
  end if;

  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_f2;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- G. ADMIN sees all via public.is_admin(). SKIPs (not a false result) if
-- the configured admin_id does not actually hold role = 'ADMIN'.
-- =============================================================
savepoint sp_g;
do $$
declare
  cfg record;
  v_admin_role text;
  v_total int;
  v_seen int;
  v_results jsonb := '[]'::jsonb;
begin
  select * into cfg from _isolation_config limit 1;
  select role::text into v_admin_role from public.users where id = cfg.admin_id;

  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: G-admin-sees-all: SKIP (admin_id role is %)', coalesce(v_admin_role, 'NULL/not found');
    v_results := v_results || jsonb_build_object('name','G-admin-sees-all','status','SKIP','detail',format('admin_id role is %s not ADMIN - point admin_id at a real ADMIN user', coalesce(v_admin_role, 'NULL/not found')));
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('66666666-6666-6666-6666-666666666666', cfg.buyer_1_id, 'DRAFT', 1,
      '{}'::jsonb, '{}'::jsonb);

    select count(*) into v_total from public.orders;

    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', cfg.admin_id, 'role', 'authenticated')::text, true);

    select count(*) into v_seen from public.orders;
    if v_seen = v_total then
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: PASS (% rows)', v_total;
      v_results := v_results || jsonb_build_object('name','G-admin-sees-all','status','PASS','detail',format('admin sees all %s rows', v_total));
    else
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: FAIL (% of %)', v_seen, v_total;
      v_results := v_results || jsonb_build_object('name','G-admin-sees-all','status','FAIL','detail',format('admin saw %s of %s rows', v_seen, v_total));
    end if;

    execute 'reset role';
  end if;

  perform set_config('app.iso_relay', v_results::text, false);
end $$;
rollback to savepoint sp_g;
insert into _isolation_results (block_name, status, detail)
select r->>'name', r->>'status', r->>'detail'
from jsonb_array_elements(current_setting('app.iso_relay')::jsonb) as r;


-- =============================================================
-- RESULTS — this is the last SELECT in the script, so it's what the
-- Supabase SQL Editor Results grid shows. Copy straight from there.
-- =============================================================
select sort_order, block_name, status, detail
from _isolation_results
order by sort_order;

-- =============================================================
-- Final cleanup: this single rollback discards EVERYTHING in the whole
-- script — both temp tables, every seed row, all of it. Nothing persists.
-- The results SELECT above already ran and returned its output before
-- this executes, so the grid keeps showing it.
-- =============================================================
rollback;

-- =============================================================
-- NOT TESTABLE IN SQL: non-admin rejection of the admin status-transition
-- action. lib/orders/admin-update-order-status.ts checks
-- public.users.role = 'ADMIN' from a SESSION client before doing anything,
-- then writes via the service-role client (which bypasses PostgREST
-- grants entirely, by design — see the file's header comment). That
-- app-level role check cannot be exercised from raw SQL. Test it from the
-- app/API instead: call adminUpdateOrderStatus as a BUYER or SELLER
-- session -> EXPECT { ok: false, code: 'FORBIDDEN' }.
-- =============================================================
