-- =============================================================
-- SKXNZ — Slice 5 ISOLATION test (D4-7), safe-claims rewrite.
-- Run AFTER 0005_commerce_layer.sql has been applied and
-- 0005_commerce_layer_verify.sql has passed.
--
-- BUG THIS FIXES (ERROR 22P02: invalid input syntax for type json /
-- "The input string ended unexpectedly"): the previous version relayed
-- each block's verdicts through a session GUC (`set_config('app.iso_relay',
-- json, false)`) and read it back with `current_setting(...)::jsonb` AFTER
-- a `rollback to savepoint`. That relied on a wrong assumption: in
-- Postgres, GUC changes made by set_config are TRANSACTIONAL regardless of
-- the is_local flag — ROLLBACK TO SAVEPOINT reverts them just like table
-- rows. After the rollback the GUC was empty, and casting the empty
-- string to jsonb raised 22P02. Harness bug only — migration/RLS/grants
-- were never touched and stay untouched here.
--
-- FIX (structural): per-section `rollback to savepoint` is gone entirely,
-- and with it the fragile relay. Instead:
--   - Each block seeds rows under its own UNIQUE order ids
--     ('1111...', '2222...', '3333...', '4444...', '5555...', '6666...')
--     and every check filters by those exact ids, so blocks cannot
--     contaminate each other's counts even though seeds now accumulate
--     for the life of the script.
--   - Each block inserts its PASS/FAIL/SKIP rows STRAIGHT into the temp
--     `_isolation_results` table — no GUC, no re-parse, nothing to break.
--   - ONE outer transaction wraps the whole file: `begin;` at the top,
--     single `rollback;` at the very bottom (after the results SELECT),
--     which discards every seed row and both temp tables. Zero permanent
--     data, same guarantee as before.
--   - `savepoint sp_x;` markers are kept before each seeded block purely
--     as manual-recovery anchors (if you run the file piecewise and a
--     block dies, you can `rollback to savepoint sp_x;` by hand); the
--     script itself never rolls back to them.
--
-- ALSO HARDENED per review: every simulated JWT is now built with
-- `jsonb_build_object('sub', <uuid>::text, 'role', 'authenticated',
-- 'aud', 'authenticated')::text` — no hand-written JSON strings anywhere,
-- and a CONFIG sanity row proves the claims JSON round-trips through
-- ::jsonb before any test runs.
--
-- Carried forward from earlier fixes (unchanged):
--   - Whole file is ONE transaction because the Supabase SQL Editor's
--     pooled connection can swap backend sessions between separate
--     begin/rollback pairs, which previously dropped the session-scoped
--     temp config table mid-script (42P01).
--   - Every query that can legitimately fail (anon selects, cross-buyer
--     insert, PAID/payment-field insert, buyer update) sits inside
--     `do $$ ... exception when insufficient_privilege ... end $$;` so an
--     EXPECTED denial is recorded as PASS instead of aborting the batch.
--   - Final `select * from _isolation_results order by sort_order;` is the
--     last SELECT in the script, so the Supabase Results grid shows a
--     clean copyable PASS/FAIL/SKIP/WARN table. RAISE NOTICE lines kept
--     for anyone watching the Messages/log panel.
--
-- This file grants NOTHING to anon and no extra grants to authenticated.
-- Permission denials it exercises are the intended, correct behaviour.
-- =============================================================

begin;

-- =============================================================
-- CONFIG — edit this ONE insert if you need different test accounts.
-- Values below are pre-filled from the live D4-7 test run. NOTES:
-- - admin_id and seller_id are the SAME user in that data — Block G below
--   detects this and SKIPs (rather than falsely PASSes/FAILs) unless that
--   user's public.users.role is actually 'ADMIN'. Point admin_id at a real
--   ADMIN-role user for a meaningful admin test.
-- SELLER-TEST NOTE (this fix): the live `seller_id` / product owner
-- (31e9e3aa, info@skxnz.com) also has role ADMIN, so `public.is_admin()`
-- is true for it. Running the seller checks as that user exercised the
-- admin "manage all" policies, NOT the seller policy — which is why
-- E-seller-no-order-access and F-seller-no-draft-access previously came
-- back FAIL (an admin is SUPPOSED to see parent orders and draft lines).
-- Those were false positives from a mis-configured identity, not an RLS
-- bug. To test the seller policy for real, the seller blocks below use a
-- NON-ADMIN `seller_probe_id` and, inside this rollback-only transaction,
-- temporarily (a) set that user's role to SELLER and (b) reassign the test
-- product's seller_id to the probe. The single final `rollback;` restores
-- the real product owner and the probe's original role — nothing persists.
--
-- `other_seller_id` must be a THIRD identity that is neither the probe nor
-- an admin (an admin would see everything and fail F2). It is set to
-- buyer_1 here (a plain non-admin non-owner), which is what F2 needs.
-- =============================================================
create temp table _isolation_config (
  buyer_1_id      uuid not null,
  buyer_2_id      uuid not null,
  seller_id       uuid not null, -- the CURRENT (possibly admin) product owner; used only for overlap detection
  seller_probe_id uuid not null, -- NON-ADMIN user the seller policy is actually tested against
  other_seller_id uuid not null, -- a third non-admin, non-owner identity for F2
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
  (buyer_1_id, buyer_2_id, seller_id, seller_probe_id, other_seller_id, admin_id, product_id)
values (
  '585102c1-e55d-427d-b0be-de7e71134dc2', -- buyer_1_id
  '39cb4363-8162-4069-8b6a-87dfb69c0afe', -- buyer_2_id
  '31e9e3aa-adbb-4063-9682-394f8d8807c1', -- seller_id (current owner; is ADMIN in live data)
  '39cb4363-8162-4069-8b6a-87dfb69c0afe', -- seller_probe_id (NON-ADMIN; product temp-reassigned to this for E/F)
  '585102c1-e55d-427d-b0be-de7e71134dc2', -- other_seller_id (buyer_1: distinct non-admin non-owner, for F2)
  '31e9e3aa-adbb-4063-9682-394f8d8807c1', -- admin_id (real ADMIN, for Block G)
  '4d378027-572e-42b0-9357-225e34c043d0'  -- product_id
);

-- =============================================================
-- TEMP-ONLY HARNESS GRANTS. The blocks below run their commerce-table
-- checks under `set local role anon|authenticated`, and still need to
-- write their PASS/FAIL/SKIP verdicts into the bookkeeping tables while
-- that role is active — otherwise the insert hits
--   ERROR 42501: permission denied for table _isolation_results
-- (which was exactly the failure this fix resolves). These grants apply
-- ONLY to the two pg_temp harness tables (`_isolation_config`,
-- `_isolation_results`) and the serial's sequence — session-local objects
-- that never persist and are wiped by the final rollback. They touch NO
-- real table: no grant is added to public.orders / order_items / etc, and
-- nothing in supabase/migrations/0005_commerce_layer.sql changes. The
-- point of the harness (real commerce tables stay locked to anon/
-- authenticated) is unaffected — these are different, throwaway tables.
-- =============================================================
grant select on _isolation_config to anon, authenticated;
grant select, insert on _isolation_results to anon, authenticated;
grant usage, select on sequence _isolation_results_sort_order_seq to anon, authenticated;

-- Prove the grant actually lets a role-switched block record a result,
-- before any real test relies on it. Switches to authenticated, writes one
-- row, resets. If the grant were missing this block would raise 42501 and
-- the CONFIG-temp-result-write row would be absent from the grid.
do $$
begin
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
  insert into _isolation_results (block_name, status, detail)
  values ('CONFIG-temp-result-write', 'PASS', 'authenticated role can record harness results (temp-table grant works)');
  execute 'reset role';
exception
  when insufficient_privilege then
    execute 'reset role';
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-temp-result-write', 'FAIL', 'authenticated role cannot write _isolation_results - temp grant missing');
end $$;

-- CONFIG sanity: exactly one config row, claims JSON round-trips, plus
-- product-ownership and admin-role diagnostics.
do $$
declare
  v_row_count int;
  cfg record;
  v_product_seller uuid;
  v_admin_role text;
  v_claims text;
  v_parsed jsonb;
begin
  select count(*) into v_row_count from _isolation_config;
  if v_row_count <> 1 then
    raise notice 'ISOLATION_RESULT: CONFIG: FAIL (% rows, expected 1)', v_row_count;
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG', 'FAIL', format('_isolation_config has %s rows, expected exactly 1 - fix the INSERT above', v_row_count));
    return;
  end if;

  insert into _isolation_results (block_name, status, detail)
  values ('CONFIG-row-count', 'PASS', 'exactly 1 config row');

  select * into cfg from _isolation_config limit 1;

  -- Claims JSON sanity: build exactly what every block below will pass to
  -- set_config, parse it back, and verify the sub survives the round trip.
  v_claims := jsonb_build_object(
    'sub', cfg.buyer_1_id::text,
    'role', 'authenticated',
    'aud', 'authenticated'
  )::text;
  begin
    v_parsed := v_claims::jsonb;
    if (v_parsed->>'sub')::uuid = cfg.buyer_1_id then
      insert into _isolation_results (block_name, status, detail)
      values ('CONFIG-jwt-claims-json', 'PASS', 'claims JSON parses and sub round-trips: ' || v_claims);
    else
      insert into _isolation_results (block_name, status, detail)
      values ('CONFIG-jwt-claims-json', 'FAIL', 'claims JSON parsed but sub mismatch: ' || v_claims);
    end if;
  exception
    when others then
      insert into _isolation_results (block_name, status, detail)
      values ('CONFIG-jwt-claims-json', 'FAIL', 'claims JSON failed to parse: ' || coalesce(v_claims, 'NULL'));
  end;

  select seller_id into v_product_seller from public.products where id = cfg.product_id;
  insert into _isolation_results (block_name, status, detail)
  values ('CONFIG-product-ownership', 'PASS', format('test product currently owned by %s (temp-reassigned to the probe below for seller tests)', v_product_seller));

  select role::text into v_admin_role from public.users where id = cfg.admin_id;
  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: CONFIG-admin-role: WARN';
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-role', 'WARN', format('admin_id role is %s not ADMIN; Block G will SKIP', coalesce(v_admin_role, 'NULL/not found')));
  else
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-role', 'PASS', 'admin_id has ADMIN role');
  end if;
end $$;


-- =============================================================
-- SELLER PROBE SETUP (rollback-safe). The live product owner is an ADMIN,
-- so testing the seller policy as that user hits the admin "manage all"
-- policy instead (the old false-FAIL). Here, inside the outer transaction
-- only, we make the NON-ADMIN seller_probe_id a real seller and hand it
-- the test product. The single final rollback undoes both changes — the
-- real owner and the probe's real role are never actually altered.
-- If seller_probe_id happens to be ADMIN, we do NOT downgrade it; instead
-- an overlap is flagged and E/F/F2 will SKIP (a probe that is_admin can't
-- prove seller-only isolation).
-- =============================================================
do $$
declare
  cfg record;
  v_owner_role text;
  v_probe_role text;
begin
  select * into cfg from _isolation_config limit 1;

  select role::text into v_owner_role from public.users where id = cfg.seller_id;
  if v_owner_role = 'ADMIN' then
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-seller-overlap-detected', 'WARN', format('current product owner %s has role ADMIN - seller checks would exercise admin policy; using seller_probe_id instead', cfg.seller_id));
  else
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-admin-seller-overlap-detected', 'PASS', 'current product owner is not an admin');
  end if;

  select role::text into v_probe_role from public.users where id = cfg.seller_probe_id;
  if v_probe_role = 'ADMIN' then
    -- Do not touch an admin's role; seller blocks will SKIP on this.
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-seller-probe-role', 'WARN', 'seller_probe_id is ADMIN - cannot prove seller-only isolation; E/F/F2 will SKIP. Point seller_probe_id at a non-admin user.');
  else
    -- Temp: make the probe a real SELLER and the product's owner. Both
    -- revert on the final rollback.
    update public.users set role = 'SELLER' where id = cfg.seller_probe_id;
    update public.products set seller_id = cfg.seller_probe_id where id = cfg.product_id;
    insert into _isolation_results (block_name, status, detail)
    values ('CONFIG-seller-probe-role', 'PASS', format('seller_probe_id %s temporarily set to SELLER and given the test product (reverts on rollback)', cfg.seller_probe_id));
  end if;
end $$;


-- =============================================================
-- A. ANON cannot read commerce tables. anon has no JWT claims at all, so
-- none are simulated — just the role switch. PASS on permission denied OR
-- an empty result; FAIL only if rows actually come back (data leak).
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
        raise notice 'ISOLATION_RESULT: A-anon-select-%: PASS', v_table;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'PASS', '0 rows visible to anon');
      else
        raise notice 'ISOLATION_RESULT: A-anon-select-%: FAIL', v_table;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'FAIL', format('%s rows visible to anon - DATA LEAK', v_count));
      end if;
    exception
      when insufficient_privilege then
        raise notice 'ISOLATION_RESULT: A-anon-select-%: PASS (denied)', v_table;
        insert into _isolation_results (block_name, status, detail)
        values (format('A-anon-select-%s', v_table), 'PASS', 'permission denied for anon, as expected');
    end;
    execute 'reset role';
  end loop;
end $$;


-- =============================================================
-- B. BUYER 1 sees only own orders. BUYER 2 cannot read or insert into it.
-- Seed order id 3333... — every check filters on that exact id, so later
-- blocks' seeds cannot contaminate this one and vice versa. The seed stays
-- until the single final rollback (per-section rollbacks are gone — see
-- header). Savepoint kept as a manual-recovery anchor only.
-- =============================================================
savepoint sp_b;
do $$
declare
  cfg record;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  -- Seed as table owner (bypasses RLS, matches how the migration itself
  -- was applied) so this block does not depend on the buyer insert
  -- policy succeeding.
  insert into public.orders (
    id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot
  ) values (
    '33333333-3333-3333-3333-333333333333', cfg.buyer_1_id, 'DRAFT', 100000,
    jsonb_build_object('fullName', 'A', 'phone', '0', 'email', 'a@x.com'),
    jsonb_build_object('line1', '1', 'line2', '', 'city', 'C', 'state', 'S', 'pincode', '000000', 'country', 'India')
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', cfg.buyer_1_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 1 then
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: PASS';
    insert into _isolation_results (block_name, status, detail)
    values ('B-buyer1-sees-own', 'PASS', '1 row visible');
  else
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: FAIL';
    insert into _isolation_results (block_name, status, detail)
    values ('B-buyer1-sees-own', 'FAIL', format('expected 1, got %s', v_count));
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', cfg.buyer_2_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 0 then
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: PASS';
    insert into _isolation_results (block_name, status, detail)
    values ('B-buyer2-cross-read', 'PASS', '0 rows - cannot see buyer 1 order');
  else
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: FAIL';
    insert into _isolation_results (block_name, status, detail)
    values ('B-buyer2-cross-read', 'FAIL', format('%s rows visible - CROSS-BUYER LEAK', v_count));
  end if;

  begin
    insert into public.orders (
      buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot
    ) values (
      cfg.buyer_1_id, 'DRAFT', 1, '{}'::jsonb, '{}'::jsonb
    );
    raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: FAIL';
    insert into _isolation_results (block_name, status, detail)
    values ('B-buyer2-insert-as-buyer1', 'FAIL', 'insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('B-buyer2-insert-as-buyer1', 'PASS', 'RLS blocked cross-buyer insert');
  end;

  execute 'reset role';
end $$;


-- =============================================================
-- C. BUYER cannot set PAID or a payment reference on insert.
-- No surviving seed rows (both inserts are expected to be denied).
-- =============================================================
savepoint sp_c;
do $$
declare
  cfg record;
begin
  select * into cfg from _isolation_config limit 1;
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', cfg.buyer_1_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'PAID', 1, '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: FAIL';
    insert into _isolation_results (block_name, status, detail)
    values ('C-buyer-insert-paid', 'FAIL', 'insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('C-buyer-insert-paid', 'PASS', 'RLS blocked PAID on insert');
  end;

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      payment_reference, contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'DRAFT', 1, 'fake_ref', '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: FAIL';
    insert into _isolation_results (block_name, status, detail)
    values ('C-buyer-insert-payment-ref', 'FAIL', 'insert succeeded - should have been blocked');
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('C-buyer-insert-payment-ref', 'PASS', 'RLS blocked pre-filled payment_reference');
  end;

  execute 'reset role';
end $$;


-- =============================================================
-- D. BUYER has no UPDATE path on orders (server-only status transitions).
-- Seed order id 4444...; checks filter on that id.
-- =============================================================
savepoint sp_d;
do $$
declare
  cfg record;
  v_status text;
begin
  select * into cfg from _isolation_config limit 1;

  insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('44444444-4444-4444-4444-444444444444', cfg.buyer_1_id, 'DRAFT', 1,
    '{}'::jsonb, '{}'::jsonb);

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', cfg.buyer_1_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );

  begin
    update public.orders set status = 'PAID'
    where id = '44444444-4444-4444-4444-444444444444';
    -- No error: check whether the row actually changed (grant may allow
    -- the statement but RLS could still filter it to 0 affected rows).
    execute 'reset role';
    select status into v_status from public.orders
    where id = '44444444-4444-4444-4444-444444444444';
    if v_status = 'PAID' then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('D-buyer-update-to-paid', 'FAIL', 'status became PAID - BUYER MUTATED PAYMENT STATE');
    else
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('D-buyer-update-to-paid', 'PASS', format('update affected 0 rows; status still %s', v_status));
    end if;
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS (denied)';
      insert into _isolation_results (block_name, status, detail)
      values ('D-buyer-update-to-paid', 'PASS', 'permission denied - no UPDATE grant');
      execute 'reset role';
  end;
end $$;


-- =============================================================
-- E. SELLER sees only own product lines, and only on post-payment orders.
-- Runs as the NON-ADMIN seller_probe_id, which the setup block above made
-- the temporary owner of the test product. Seed PAID order 1111... + line;
-- checks filter on order id 1111... SKIPs if the probe never became the
-- owner (i.e. probe was ADMIN, so setup declined the reassignment).
--
-- REQUIRES 0006_fix_seller_order_item_rls.sql. Under 0005 alone this
-- returned 0 (FAIL): the old seller policy's EXISTS subquery on
-- public.orders was filtered by orders RLS (sellers have no orders SELECT
-- policy), so it never matched. 0006 moves that check into a SECURITY
-- DEFINER helper. Apply 0006 before expecting E-seller-sees-own-line PASS.
-- =============================================================
savepoint sp_e;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_probe_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    insert into _isolation_results (block_name, status, detail)
    values ('E-seller-sees-own-line', 'SKIP', 'seller probe did not take ownership (seller_probe_id is ADMIN?) - point it at a non-admin user'),
           ('E-seller-no-order-access', 'SKIP', 'same reason');
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
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', cfg.seller_probe_id::text,
        'role', 'authenticated',
        'aud', 'authenticated'
      )::text,
      true
    );

    select count(*) into v_count from public.order_items
    where order_id = '11111111-1111-1111-1111-111111111111';
    if v_count = 1 then
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('E-seller-sees-own-line', 'PASS', '1 row visible on PAID order');
    else
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('E-seller-sees-own-line', 'FAIL', format('expected 1, got %s', v_count));
    end if;

    select count(*) into v_count from public.orders
    where id = '11111111-1111-1111-1111-111111111111';
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('E-seller-no-order-access', 'PASS', '0 rows - seller cannot read the orders table row');
    else
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('E-seller-no-order-access', 'FAIL', format('%s rows - seller read the parent order', v_count));
    end if;

    execute 'reset role';
  end if;
end $$;


-- =============================================================
-- F. SELLER sees NOTHING on a DRAFT/PAYMENT_PENDING order (open cart).
-- Seed DRAFT order 2222... + one line; check filters on order id 2222...
-- (the PAID line from Block E stays in the transaction but is excluded by
-- the id filter, so it cannot fake a FAIL here).
-- =============================================================
savepoint sp_f;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_probe_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    insert into _isolation_results (block_name, status, detail)
    values ('F-seller-no-draft-access', 'SKIP', 'seller probe did not take ownership (seller_probe_id is ADMIN?) - point it at a non-admin user');
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
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', cfg.seller_probe_id::text,
        'role', 'authenticated',
        'aud', 'authenticated'
      )::text,
      true
    );

    select count(*) into v_count from public.order_items
    where order_id = '22222222-2222-2222-2222-222222222222';
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('F-seller-no-draft-access', 'PASS', '0 rows - draft-order line hidden from seller');
    else
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('F-seller-no-draft-access', 'FAIL', format('%s rows - seller saw a DRAFT-order line', v_count));
    end if;

    execute 'reset role';
  end if;
end $$;


-- =============================================================
-- F2. OTHER SELLER sees ZERO lines for a product they do not own.
-- Seed PAID order 5555... + one line; check filters on order id 5555...
-- =============================================================
savepoint sp_f2;
do $$
declare
  cfg record;
  v_owns boolean;
  v_other_role text;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_probe_id) into v_owns
  from public.products where id = cfg.product_id;
  select role::text into v_other_role from public.users where id = cfg.other_seller_id;

  if v_owns is not true then
    insert into _isolation_results (block_name, status, detail)
    values ('F2-other-seller-sees-zero', 'SKIP', 'seller probe did not take ownership (seller_probe_id is ADMIN?) - point it at a non-admin user');
  elsif v_other_role = 'ADMIN' or cfg.other_seller_id = cfg.seller_probe_id then
    insert into _isolation_results (block_name, status, detail)
    values ('F2-other-seller-sees-zero', 'SKIP', 'other_seller_id must be a non-admin identity different from seller_probe_id (an admin sees all; the owner sees its own line)');
  else
    -- Order buyer is buyer_2 (NOT other_seller_id) so the other seller
    -- cannot see this line via the buyer policy either — F2 must isolate on
    -- the seller policy alone.
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('55555555-5555-5555-5555-555555555555', cfg.buyer_2_id, 'PAID', 100000,
      '{}'::jsonb, '{}'::jsonb);
    insert into public.order_items (order_id, product_id, product_slug,
      title_snapshot, unit_price_paise, quantity, line_total_paise)
    values ('55555555-5555-5555-5555-555555555555', cfg.product_id,
      'seed-slug', 'Seed', 100000, 1, 100000);

    execute 'set local role authenticated';
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', cfg.other_seller_id::text,
        'role', 'authenticated',
        'aud', 'authenticated'
      )::text,
      true
    );

    select count(*) into v_count from public.order_items
    where order_id = '55555555-5555-5555-5555-555555555555';
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('F2-other-seller-sees-zero', 'PASS', '0 rows - unrelated seller sees nothing');
    else
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('F2-other-seller-sees-zero', 'FAIL', format('%s rows - unrelated seller saw another sellers line', v_count));
    end if;

    execute 'reset role';
  end if;
end $$;


-- =============================================================
-- G. ADMIN sees all via public.is_admin(). SKIPs (not a false result) if
-- the configured admin_id does not actually hold role = 'ADMIN'.
-- Seeds order 6666...; compares owner-counted total vs admin-visible total
-- (both counts run in this same block, so earlier seeds affect both sides
-- equally and cancel out).
-- =============================================================
savepoint sp_g;
do $$
declare
  cfg record;
  v_admin_role text;
  v_total int;
  v_seen int;
begin
  select * into cfg from _isolation_config limit 1;
  select role::text into v_admin_role from public.users where id = cfg.admin_id;

  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: G-admin-sees-all: SKIP';
    insert into _isolation_results (block_name, status, detail)
    values ('G-admin-sees-all', 'SKIP', format('admin_id role is %s not ADMIN - point admin_id at a real ADMIN user', coalesce(v_admin_role, 'NULL/not found')));
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('66666666-6666-6666-6666-666666666666', cfg.buyer_1_id, 'DRAFT', 1,
      '{}'::jsonb, '{}'::jsonb);

    select count(*) into v_total from public.orders; -- as table owner: true total

    execute 'set local role authenticated';
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', cfg.admin_id::text,
        'role', 'authenticated',
        'aud', 'authenticated'
      )::text,
      true
    );

    select count(*) into v_seen from public.orders;
    if v_seen = v_total then
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: PASS';
      insert into _isolation_results (block_name, status, detail)
      values ('G-admin-sees-all', 'PASS', format('admin sees all %s rows', v_total));
    else
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: FAIL';
      insert into _isolation_results (block_name, status, detail)
      values ('G-admin-sees-all', 'FAIL', format('admin saw %s of %s rows', v_seen, v_total));
    end if;

    execute 'reset role';
  end if;
end $$;


-- =============================================================
-- RESULTS — last SELECT in the script, so it's what the Supabase SQL
-- Editor Results grid shows. Copy straight from there.
-- =============================================================
select sort_order, block_name, status, detail
from _isolation_results
order by sort_order;

-- =============================================================
-- Final cleanup: this single rollback discards EVERYTHING in the whole
-- script — both temp tables and every seed row (1111/2222/3333/4444/
-- 5555/6666 orders and their lines). Nothing persists. The results
-- SELECT above already returned its output before this executes, so the
-- grid keeps showing it.
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
