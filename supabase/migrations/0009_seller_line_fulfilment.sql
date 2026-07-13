-- =============================================================
-- SKXNZ — Slice 9: Seller line-level fulfilment (D3-A, DRAFT)
--
-- Adds per-order_item seller fulfilment state so sellers can move
-- their OWN order lines through preparing / packed / handed-to-
-- delivery without touching whole-order status (which stays owned
-- by admin + the future signature-verified payment webhook).
--
-- NOT APPLIED. Run in Supabase SQL Editor (Project -> SQL Editor
-- -> New query). Do NOT run via CLI or ORM. Do NOT modify env.
-- Safe to re-run: every statement is idempotent.
--
-- Depends on: 0005_commerce_layer.sql (public.order_items,
--             public.orders, public.is_admin, public.set_updated_at),
--             0006_fix_seller_order_item_rls.sql (seller SELECT
--             policy on order_items via seller_owns_post_payment_order_line).
--
-- The seller UPDATE path uses the service-role client server-side
-- (authenticated has no UPDATE grant on order_items after this file)
-- so the application layer stays the sole gate on transitions and
-- payment/whole-order state cannot be forged from the client.
-- =============================================================


-- =============================================================
-- 1. COLUMNS on public.order_items
--    Adds per-line fulfilment state, seller note, timestamp of
--    last seller update. Backfills existing rows to 'PENDING' via
--    the DEFAULT because these columns are being introduced now.
-- =============================================================

alter table public.order_items
  add column if not exists seller_fulfilment_status text not null default 'PENDING';

alter table public.order_items
  add column if not exists seller_fulfilment_note text;

alter table public.order_items
  add column if not exists seller_fulfilment_updated_at timestamptz;

-- Idempotent constraint: drop then recreate so a partial re-run
-- doesn't leave a stale enum set behind.
alter table public.order_items
  drop constraint if exists order_items_seller_fulfilment_status_check;

alter table public.order_items
  add constraint order_items_seller_fulfilment_status_check
  check (seller_fulfilment_status in (
    'PENDING',
    'ACCEPTED',
    'PACKED',
    'HANDED_TO_DELIVERY'
  ));

create index if not exists order_items_seller_fulfilment_status_idx
  on public.order_items (seller_fulfilment_status);


-- =============================================================
-- 2. TABLE: public.order_item_events
--    Append-only per-line audit trail. Written server-side by
--    the seller/admin action; readable by the same actors that
--    can read the parent line.
-- =============================================================

create table if not exists public.order_item_events (
  id            uuid        primary key default gen_random_uuid(),
  order_item_id uuid        not null references public.order_items(id) on delete cascade,
  event_type    text        not null
    constraint order_item_events_event_type_not_blank check (length(trim(event_type)) > 0),
  from_status   text,
  to_status     text,
  actor_user_id uuid        references public.users(id),
  message       text        not null
    constraint order_item_events_message_not_blank check (length(trim(message)) > 0),
  metadata      jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

comment on table public.order_item_events is
  'Append-only per-line seller/admin fulfilment audit trail. Inserted server-side only.';

create index if not exists order_item_events_line_idx
  on public.order_item_events (order_item_id, created_at);

alter table public.order_item_events enable row level security;


-- =============================================================
-- 3. RLS POLICIES
--    Sellers may SELECT events for lines whose product is theirs
--    (reuses the SECURITY DEFINER helper from 0006 so the join
--    doesn't get filtered by orders RLS). Buyers can SELECT events
--    for their own order's lines. Admin manages all. No INSERT is
--    granted to anon/authenticated — writes come via service-role
--    from the server actions.
-- =============================================================

drop policy if exists "order_item_events: seller can select own" on public.order_item_events;
create policy "order_item_events: seller can select own"
  on public.order_item_events
  for select
  using (
    exists (
      select 1
      from public.order_items oi
      where oi.id = order_item_events.order_item_id
        and public.seller_owns_post_payment_order_line(oi.order_id, oi.product_id)
    )
  );

drop policy if exists "order_item_events: buyer can select own" on public.order_item_events;
create policy "order_item_events: buyer can select own"
  on public.order_item_events
  for select
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_events.order_item_id
        and o.buyer_id = auth.uid()
    )
  );

drop policy if exists "order_item_events: admin can manage all" on public.order_item_events;
create policy "order_item_events: admin can manage all"
  on public.order_item_events
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- =============================================================
-- 4. GRANTS
--    Revoke defaults first, then grant only SELECT on the events
--    table. No UPDATE on order_items for anon/authenticated — the
--    seller/admin action does the write with service_role.
-- =============================================================

revoke all on public.order_item_events from anon, authenticated;
grant select on public.order_item_events to authenticated;

-- Existing order_items grants (from 0005) already give authenticated
-- select+insert but NO update — that is exactly what this slice needs.
-- No change required here.


-- =============================================================
-- 5. NOTES
--
--  * Allowed forward transitions (enforced in the server action,
--    not the DB):
--      PENDING            -> ACCEPTED
--      ACCEPTED           -> PACKED
--      PACKED             -> HANDED_TO_DELIVERY
--      HANDED_TO_DELIVERY -> terminal
--    Repeated / backwards transitions are rejected by the action
--    and never touch this table.
--
--  * PAID / DELIVERED / REFUNDED on public.orders are NEVER set
--    by anything in this file. Whole-order status stays owned by
--    the admin transition action + the (future) payment webhook.
--
--  * No inventory decrement, no shipping-label creation, no
--    courier assignment — none of those exist yet. This is the
--    seller-facing operational timeline only.
-- =============================================================
