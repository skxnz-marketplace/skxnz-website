-- =============================================================
-- SKXNZ — Slice 6: fix the seller order_items SELECT policy (D4-7).
-- Run this in the Supabase SQL Editor AFTER 0005_commerce_layer.sql.
-- Idempotent: safe to re-run.
--
-- BUG (found by the 0005 isolation harness, block E-seller-sees-own-line):
-- the 0005 policy "order_items: seller can select own product lines" was
--
--   using (
--     exists (
--       select 1
--       from public.orders o
--       join public.products p on p.id = order_items.product_id
--       where o.id = order_items.order_id
--         and p.seller_id = auth.uid()
--         and o.status not in ('DRAFT', 'PAYMENT_PENDING')
--     )
--   );
--
-- That EXISTS subquery reads public.orders directly. RLS on public.orders
-- is re-applied to that subquery under the CALLER's role, and sellers have
-- NO select policy on public.orders (by design — sellers must not read
-- buyer orders). So for a seller the subquery always finds zero order
-- rows, the EXISTS is always false, and a seller can NEVER see the line
-- items for their own paid orders. The seller order queue
-- (lib/orders/read-seller-orders.ts) would always come back empty.
--
-- The buyer sibling policy works only because buyers DO have a select
-- policy on their own orders; the seller path has no such policy, so the
-- same shape silently fails closed.
--
-- FIX: move the ownership + status check into a SECURITY DEFINER helper
-- (same technique as public.is_admin() in 0003). Running as the function
-- owner bypasses RLS on public.orders and public.products, so the status
-- and seller_id can be read, while the function still returns only a
-- boolean about the CURRENT caller (auth.uid() is unaffected by SECURITY
-- DEFINER — it reads request.jwt.claims, which stays the caller's).
--
-- This does NOT weaken isolation:
--   - Sellers still cannot SELECT any row of public.orders (no policy
--     added there) — they get a boolean, never order/buyer data.
--   - DRAFT and PAYMENT_PENDING lines stay hidden (status check kept).
--   - Unrelated products stay hidden (p.seller_id = auth.uid() kept).
--   - Buyers, admin, anon paths are untouched.
-- =============================================================


-- =============================================================
-- 1. HELPER: public.seller_owns_post_payment_order_line(order_id, product_id)
--    True iff the current caller is the seller of product_id AND the
--    parent order is past the pre-payment stage. SECURITY DEFINER so the
--    orders/products reads bypass RLS; STABLE; pinned search_path.
-- =============================================================

create or replace function public.seller_owns_post_payment_order_line(
  p_order_id   uuid,
  p_product_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.orders o
    join public.products p on p.id = p_product_id
    where o.id = p_order_id
      and p.seller_id = auth.uid()
      and o.status not in ('DRAFT', 'PAYMENT_PENDING')
  );
$$;

comment on function public.seller_owns_post_payment_order_line(uuid, uuid) is
  'True iff the current authenticated user is the seller of p_product_id and the parent order p_order_id is past DRAFT/PAYMENT_PENDING. SECURITY DEFINER so an order_items RLS policy can check order status + product ownership without granting sellers any read access to public.orders. Returns only a boolean about the caller.';


-- =============================================================
-- 2. REPOINT the seller order_items SELECT policy at the helper.
--    Same name + same intent as 0005; now it actually evaluates true for
--    a seller's own post-payment lines. Idempotent drop/recreate.
-- =============================================================

drop policy if exists "order_items: seller can select own product lines" on public.order_items;
create policy "order_items: seller can select own product lines"
  on public.order_items
  for select
  using (
    public.seller_owns_post_payment_order_line(
      order_items.order_id,
      order_items.product_id
    )
  );


-- =============================================================
-- 3. VERIFY (read-only; run after the two statements above).
-- =============================================================

-- Helper exists. EXPECT: 1 row, present = true.
-- select 'seller_owns_post_payment_order_line' as fn,
--   to_regprocedure('public.seller_owns_post_payment_order_line(uuid, uuid)') is not null as present;

-- Policy still present and is SELECT-only. EXPECT: 1 row, cmd = SELECT.
-- select policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'order_items'
--   and policyname = 'order_items: seller can select own product lines';

-- Full re-run of supabase/verification/0005_commerce_layer_isolation.sql
-- should now show E-seller-sees-own-line = PASS while E-seller-no-order-
-- access, F-seller-no-draft-access, and F2-other-seller-sees-zero stay
-- PASS (isolation preserved).
