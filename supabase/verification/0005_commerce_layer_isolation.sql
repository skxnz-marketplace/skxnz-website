-- =============================================================
-- SKXNZ — Slice 5 ISOLATION test (D4-7), single-transaction rewrite.
-- Run AFTER 0005_commerce_layer.sql has been applied and
-- 0005_commerce_layer_verify.sql has passed.
--
-- BUG THIS FIXES: the previous version wrapped each lettered section in
-- its own `begin; ... rollback;` pair. The Supabase SQL Editor runs
-- through a POOLED connection (pgbouncer-style). Each explicit
-- BEGIN...COMMIT/ROLLBACK boundary can hand the backend connection back to
-- the pool, and the NEXT `begin;` can be served by a DIFFERENT backend
-- process. `_isolation_config` is a session-scoped TEMP TABLE, so once the
-- pool swapped connections mid-script, later sections hit:
--   ERROR 42P01: relation "_isolation_config" does not exist
-- This is a harness execution-order bug, not a migration/RLS bug.
--
-- FIX: the ENTIRE script now runs inside exactly ONE outer transaction
-- (one `begin;` at the top, one `rollback;` at the very bottom), so there
-- is only one BEGIN/END boundary for the pool to worry about and the temp
-- table is guaranteed to exist for every statement in between. Per-section
-- isolation (undoing each section's seed rows) uses SAVEPOINT /
-- ROLLBACK TO SAVEPOINT instead of separate transactions — the standard
-- Postgres way to get "sub-transactions" inside one real transaction.
-- SAVEPOINT/ROLLBACK TO are plain top-level SQL statements; they are
-- issued BETWEEN `do $$ ... $$;` blocks, never from inside one (Postgres
-- does not allow transaction-control statements inside PL/pgSQL bodies).
--
-- Also unchanged from the prior fix: every query that can legitimately
-- fail (anon selects, cross-buyer insert, PAID/payment-field insert,
-- buyer update) is wrapped in `do $$ ... exception when ... end $$;` so a
-- caught error never reaches the client and the script keeps running.
-- Each check prints `ISOLATION_RESULT: <name>: PASS|FAIL|SKIP ...` via
-- RAISE NOTICE — read the Supabase SQL Editor's "Messages"/log output
-- (not the results grid) for these.
--
-- This file does NOT touch supabase/migrations/0005_commerce_layer.sql and
-- grants NOTHING to anon or extra grants to authenticated. Permission
-- denials it exercises are the intended, correct behaviour.
--
-- NO PERMANENT DATA IS LEFT BEHIND: the single outer `rollback;` at the
-- end undoes everything in the whole script, including the temp table
-- itself and every seed row. If the script is interrupted before reaching
-- that final `rollback;`, Postgres auto-rolls back the (still open)
-- transaction when the connection closes.
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
) on commit drop; -- belt-and-suspenders: even if the final rollback is
                  -- skipped somehow, ON COMMIT DROP clears it on commit.

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

-- Sanity check: exactly one config row (guards a hand-edited insert that
-- accidentally added/removed rows) plus diagnostic WARN/OK notices. This
-- can no longer see "relation does not exist" — the table above is
-- created in this same transaction, a few statements up.
do $$
declare
  v_row_count int;
  cfg record;
  v_product_seller uuid;
  v_admin_role text;
begin
  select count(*) into v_row_count from _isolation_config;
  if v_row_count <> 1 then
    raise notice 'ISOLATION_RESULT: CONFIG: FAIL (_isolation_config has % rows, expected exactly 1 - fix the INSERT above)', v_row_count;
    return;
  end if;

  select * into cfg from _isolation_config limit 1;

  select seller_id into v_product_seller from public.products where id = cfg.product_id;
  if v_product_seller is distinct from cfg.seller_id then
    raise notice 'ISOLATION_RESULT: CONFIG-product-ownership: WARN (product_id belongs to seller % not configured seller %; blocks E/F/F2 will SKIP)', v_product_seller, cfg.seller_id;
  else
    raise notice 'ISOLATION_RESULT: CONFIG-product-ownership: OK (product belongs to configured seller_id)';
  end if;

  select role::text into v_admin_role from public.users where id = cfg.admin_id;
  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: CONFIG-admin-role: WARN (admin_id role is % not ADMIN; Block G will SKIP)', coalesce(v_admin_role, 'NULL/not found');
  else
    raise notice 'ISOLATION_RESULT: CONFIG-admin-role: OK (admin_id has ADMIN role)';
  end if;
end $$;


-- =============================================================
-- A. ANON cannot read commerce tables.
-- PASS if: permission denied (no anon grant) OR a successful query
--          returns 0 rows (RLS would still block a future accidental
--          grant). FAIL only on an actual non-empty result (data leak).
-- =============================================================
savepoint sp_a;
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
      else
        raise notice 'ISOLATION_RESULT: A-anon-select-%: FAIL (% rows visible to anon - DATA LEAK)', v_table, v_count;
      end if;
    exception
      when insufficient_privilege then
        raise notice 'ISOLATION_RESULT: A-anon-select-%: PASS (permission denied for anon, as expected)', v_table;
    end;
    execute 'reset role';
  end loop;
end $$;
rollback to savepoint sp_a;


-- =============================================================
-- B. BUYER 1 sees only own orders. BUYER 2 cannot read or insert into it.
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
    '{"fullName":"A","phone":"0","email":"a@x.com"}'::jsonb,
    '{"line1":"1","line2":"","city":"C","state":"S","pincode":"000000","country":"India"}'::jsonb
  );

  -- Buyer 1 reads own order.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 1 then
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: PASS (1 row visible)';
  else
    raise notice 'ISOLATION_RESULT: B-buyer1-sees-own: FAIL (expected 1, got %)', v_count;
  end if;

  -- Switch to buyer 2: must not see buyer 1's order.
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_2_id, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = '33333333-3333-3333-3333-333333333333';
  if v_count = 0 then
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: PASS (0 rows - cannot see buyer 1 order)';
  else
    raise notice 'ISOLATION_RESULT: B-buyer2-cross-read: FAIL (% rows visible - CROSS-BUYER LEAK)', v_count;
  end if;

  -- Buyer 2 attempts to insert an order claiming buyer 1's id.
  begin
    insert into public.orders (
      buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot
    ) values (
      cfg.buyer_1_id, 'DRAFT', 1, '{}'::jsonb, '{}'::jsonb
    );
    raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: FAIL (insert succeeded - should have been blocked)';
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: B-buyer2-insert-as-buyer1: PASS (RLS blocked cross-buyer insert)';
  end;

  execute 'reset role';
end $$;
rollback to savepoint sp_b;


-- =============================================================
-- C. BUYER cannot set PAID or a payment reference on insert.
-- =============================================================
savepoint sp_c;
do $$
declare
  cfg record;
begin
  select * into cfg from _isolation_config limit 1;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'PAID', 1, '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: FAIL (insert succeeded - should have been blocked)';
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-paid: PASS (RLS blocked PAID on insert)';
  end;

  begin
    insert into public.orders (buyer_id, status, subtotal_amount_paise,
      payment_reference, contact_snapshot, shipping_address_snapshot)
    values (cfg.buyer_1_id, 'DRAFT', 1, 'fake_ref', '{}'::jsonb, '{}'::jsonb);
    raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: FAIL (insert succeeded - should have been blocked)';
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: C-buyer-insert-payment-ref: PASS (RLS blocked pre-filled payment_reference)';
  end;

  execute 'reset role';
end $$;
rollback to savepoint sp_c;


-- =============================================================
-- D. BUYER has no UPDATE path on orders (server-only status transitions).
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
  perform set_config('request.jwt.claims',
    json_build_object('sub', cfg.buyer_1_id, 'role', 'authenticated')::text, true);

  begin
    update public.orders set status = 'PAID'
    where id = '44444444-4444-4444-4444-444444444444';
    -- No error: check whether the row actually changed (grant may allow
    -- the statement but RLS could still filter it to 0 affected rows).
    execute 'reset role';
    select status into v_status from public.orders
    where id = '44444444-4444-4444-4444-444444444444';
    if v_status = 'PAID' then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: FAIL (status became PAID - BUYER MUTATED PAYMENT STATE)';
    else
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS (update affected 0 rows; status still %)', v_status;
    end if;
  exception
    when insufficient_privilege then
      raise notice 'ISOLATION_RESULT: D-buyer-update-to-paid: PASS (permission denied - no UPDATE grant)';
      execute 'reset role';
  end;
end $$;
rollback to savepoint sp_d;


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
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: SKIP (configured product_id is not owned by configured seller_id - fix _isolation_config)';
    raise notice 'ISOLATION_RESULT: E-seller-no-order-access: SKIP (same reason)';
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
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: PASS (1 row visible on PAID order)';
    else
      raise notice 'ISOLATION_RESULT: E-seller-sees-own-line: FAIL (expected 1, got %)', v_count;
    end if;

    select count(*) into v_count from public.orders
    where id = '11111111-1111-1111-1111-111111111111';
    if v_count = 0 then
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: PASS (0 rows - seller cannot read the orders table row)';
    else
      raise notice 'ISOLATION_RESULT: E-seller-no-order-access: FAIL (% rows - seller read the parent order)', v_count;
    end if;

    execute 'reset role';
  end if;
end $$;
rollback to savepoint sp_e;


-- =============================================================
-- F. SELLER sees NOTHING on a DRAFT/PAYMENT_PENDING order (open cart).
-- =============================================================
savepoint sp_f;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: SKIP (configured product_id is not owned by configured seller_id - fix _isolation_config)';
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
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: PASS (0 rows - draft-order line hidden from seller)';
    else
      raise notice 'ISOLATION_RESULT: F-seller-no-draft-access: FAIL (% rows - seller saw a DRAFT-order line)', v_count;
    end if;

    execute 'reset role';
  end if;
end $$;
rollback to savepoint sp_f;


-- =============================================================
-- F2. OTHER SELLER sees ZERO lines for a product they do not own.
-- =============================================================
savepoint sp_f2;
do $$
declare
  cfg record;
  v_owns boolean;
  v_count int;
begin
  select * into cfg from _isolation_config limit 1;

  select (seller_id = cfg.seller_id) into v_owns
  from public.products where id = cfg.product_id;

  if v_owns is not true then
    raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: SKIP (configured product_id is not owned by configured seller_id - fix _isolation_config)';
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
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: PASS (0 rows - unrelated seller sees nothing)';
    else
      raise notice 'ISOLATION_RESULT: F2-other-seller-sees-zero: FAIL (% rows - unrelated seller saw another sellers line)', v_count;
    end if;

    execute 'reset role';
  end if;
end $$;
rollback to savepoint sp_f2;


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
begin
  select * into cfg from _isolation_config limit 1;
  select role::text into v_admin_role from public.users where id = cfg.admin_id;

  if v_admin_role is distinct from 'ADMIN' then
    raise notice 'ISOLATION_RESULT: G-admin-sees-all: SKIP (admin_id role is % not ADMIN - point admin_id at a real ADMIN user)', coalesce(v_admin_role, 'NULL/not found');
  else
    insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
      contact_snapshot, shipping_address_snapshot)
    values ('66666666-6666-6666-6666-666666666666', cfg.buyer_1_id, 'DRAFT', 1,
      '{}'::jsonb, '{}'::jsonb);

    select count(*) into v_total from public.orders; -- as table owner: true total

    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', cfg.admin_id, 'role', 'authenticated')::text, true);

    select count(*) into v_seen from public.orders;
    if v_seen = v_total then
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: PASS (admin sees all % rows)', v_total;
    else
      raise notice 'ISOLATION_RESULT: G-admin-sees-all: FAIL (admin saw % of % rows)', v_seen, v_total;
    end if;

    execute 'reset role';
  end if;
end $$;
rollback to savepoint sp_g;


-- =============================================================
-- Final cleanup: this single rollback discards EVERYTHING in the whole
-- script — the temp table, every seed row, all of it. Nothing persists.
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
