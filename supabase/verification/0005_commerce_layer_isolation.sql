-- =============================================================
-- SKXNZ — Slice 5 ISOLATION test (D4-7). Run AFTER 0005 + verify pass.
--
-- The Supabase SQL Editor runs as a superuser and BYPASSES RLS, so a plain
-- SELECT proves nothing about policies. These blocks impersonate the anon /
-- authenticated roles WITH a fake JWT claim so RLS actually fires, exactly
-- like the app clients do. Each block is a transaction that ROLLS BACK, so
-- nothing is left behind.
--
-- HOW TO USE:
--   1. Fill in the four uuids below from your live data (see the SELECTs in
--      step 0). Use two real buyers, and a seller who owns >=1 product.
--   2. Run each block. Compare row counts / errors to the EXPECT comment.
--   3. Everything rolls back — safe to re-run.
--
-- NOTE: `set local role` + `request.jwt.claims` is the documented way to
-- exercise Supabase RLS from SQL. auth.uid() reads the 'sub' claim.
-- =============================================================

-- ---- STEP 0: pick test ids (run, copy uuids into the blocks below) -------
-- Two buyers:
select id, email, role from public.users order by created_at limit 5;
-- A seller with products (seller_id) + one of their product ids:
select p.seller_id, p.id as product_id, p.status
from public.products p
where p.seller_id is not null
order by p.created_at
limit 5;

-- Replace these placeholders in each block:
--   :buyer_a  :buyer_b  :seller_id  :seller_product_id

-- =============================================================
-- A. ANON cannot touch commerce tables.
-- EXPECT: SELECT -> permission denied (no anon grant). ROLLBACK.
-- =============================================================
begin;
  set local role anon;
  -- Should ERROR: "permission denied for table orders".
  select count(*) from public.orders;
rollback;

-- =============================================================
-- B. BUYER A sees only own orders. Seed one order as A, read as B.
-- Uses a real order row created inside the txn (rolled back).
-- =============================================================
begin;
  -- Impersonate buyer A.
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', '<:buyer_a>', 'role', 'authenticated')::text,
    true
  );
  -- A inserts a DRAFT order for themselves -> allowed by insert policy.
  insert into public.orders (
    buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot
  ) values (
    '<:buyer_a>', 'DRAFT', 100000,
    '{"fullName":"A","phone":"0","email":"a@x.com"}'::jsonb,
    '{"line1":"1","line2":"","city":"C","state":"S","pincode":"000000","country":"India"}'::jsonb
  );

  -- A sees own order. EXPECT: 1.
  select count(*) as a_sees_own from public.orders where buyer_id = '<:buyer_a>';

  -- Switch to buyer B.
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', '<:buyer_b>', 'role', 'authenticated')::text,
    true
  );
  -- B must NOT see A's order. EXPECT: 0.
  select count(*) as b_sees_a from public.orders where buyer_id = '<:buyer_a>';

  -- B cannot insert an order owned by A. EXPECT: ERROR (RLS with_check).
  insert into public.orders (
    buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot
  ) values (
    '<:buyer_a>', 'DRAFT', 1,
    '{}'::jsonb, '{}'::jsonb
  );
rollback;

-- =============================================================
-- C. BUYER cannot set payment fields or PAID on insert.
-- EXPECT: both inserts ERROR (with_check: status in DRAFT/PENDING and
--         payment_provider/reference null). ROLLBACK.
-- =============================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:buyer_a>','role','authenticated')::text, true);

  -- PAID on insert -> blocked.
  insert into public.orders (buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('<:buyer_a>','PAID',1,'{}'::jsonb,'{}'::jsonb);
rollback;

begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:buyer_a>','role','authenticated')::text, true);

  -- Pre-filled payment reference -> blocked.
  insert into public.orders (buyer_id, status, subtotal_amount_paise,
    payment_reference, contact_snapshot, shipping_address_snapshot)
  values ('<:buyer_a>','DRAFT',1,'fake_ref','{}'::jsonb,'{}'::jsonb);
rollback;

-- =============================================================
-- D. BUYER has no UPDATE path on orders (status transitions server-only).
-- EXPECT: update affects 0 rows OR errors (no update policy/grant). Either
--         way A's own order status does not change to PAID.
-- =============================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:buyer_a>','role','authenticated')::text, true);

  insert into public.orders (buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('<:buyer_a>','DRAFT',1,'{}'::jsonb,'{}'::jsonb);

  -- No update grant for authenticated -> EXPECT: ERROR or 0 rows.
  update public.orders set status = 'PAID' where buyer_id = '<:buyer_a>';
rollback;

-- =============================================================
-- E. SELLER sees only own product lines, and only post-payment orders.
-- Seed: order by buyer A, one line for the seller's product, then flip the
-- order to PAID (as superuser inside the txn) so the seller policy applies.
-- =============================================================
begin;
  -- As superuser: build an order + line for the seller's product.
  insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('11111111-1111-1111-1111-111111111111', '<:buyer_a>', 'PAID', 100000,
    '{}'::jsonb, '{}'::jsonb);
  insert into public.order_items (order_id, product_id, product_slug,
    title_snapshot, unit_price_paise, quantity, line_total_paise)
  values ('11111111-1111-1111-1111-111111111111', '<:seller_product_id>',
    'seed-slug', 'Seed', 100000, 1, 100000);

  -- Impersonate the seller.
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:seller_id>','role','authenticated')::text, true);

  -- Seller sees the line for their product on the PAID order. EXPECT: 1.
  select count(*) as seller_sees_line from public.order_items
  where product_id = '<:seller_product_id>';

  -- Seller cannot read the parent order row (no seller policy on orders).
  -- EXPECT: 0.
  select count(*) as seller_sees_order from public.orders
  where id = '11111111-1111-1111-1111-111111111111';
rollback;

-- =============================================================
-- F. SELLER sees nothing on a DRAFT/PAYMENT_PENDING order (open cart).
-- Same seed but status DRAFT. EXPECT: seller_sees_line = 0.
-- =============================================================
begin;
  insert into public.orders (id, buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('22222222-2222-2222-2222-222222222222', '<:buyer_a>', 'DRAFT', 100000,
    '{}'::jsonb, '{}'::jsonb);
  insert into public.order_items (order_id, product_id, product_slug,
    title_snapshot, unit_price_paise, quantity, line_total_paise)
  values ('22222222-2222-2222-2222-222222222222', '<:seller_product_id>',
    'seed-slug', 'Seed', 100000, 1, 100000);

  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:seller_id>','role','authenticated')::text, true);

  -- EXPECT: 0 (draft orders never visible to sellers).
  select count(*) as seller_sees_draft_line from public.order_items
  where product_id = '<:seller_product_id>';
rollback;

-- =============================================================
-- G. ADMIN sees all via public.is_admin(). Impersonate an ADMIN user.
-- Replace <:admin_id> with a user whose public.users.role = 'ADMIN'.
-- EXPECT: admin_sees_all >= the true order count (all rows visible).
-- =============================================================
begin;
  insert into public.orders (buyer_id, status, subtotal_amount_paise,
    contact_snapshot, shipping_address_snapshot)
  values ('<:buyer_a>','DRAFT',1,'{}'::jsonb,'{}'::jsonb);

  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub','<:admin_id>','role','authenticated')::text, true);

  -- Admin policy "orders: admin can manage all" -> sees everything.
  select count(*) as admin_sees_all from public.orders;
rollback;

-- =============================================================
-- Non-admin admin-action rejection is enforced in APP code
-- (lib/orders/admin-update-order-status.ts checks public.users.role =
-- 'ADMIN' before the service-role write). Test that in the app smoke, not
-- here: call the action as a BUYER session -> EXPECT { ok:false,
-- code:'FORBIDDEN' }.
-- =============================================================
