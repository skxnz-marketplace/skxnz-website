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
-- Seller mutations go through the authenticated RPC defined below. It is
-- the sole, atomic trust boundary for a seller-line state change + audit.
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
-- 4. ATOMIC SELLER FULFILMENT RPC
--
-- SECURITY DEFINER is necessary because authenticated sellers deliberately
-- have no UPDATE/INSERT grants on these tables. The function derives actor
-- identity from auth.uid(), locks the owned line, validates the one-step
-- ladder, updates only seller-owned fulfilment columns, and appends the audit
-- row in the same transaction. No caller-supplied seller, order, payment,
-- refund, or order-wide status is accepted.
-- =============================================================

create or replace function public.seller_update_line_fulfilment(
  p_order_item_id uuid,
  p_action text,
  p_next_status text default null,
  p_note text default null
)
returns table (
  order_item_id uuid,
  order_id uuid,
  seller_fulfilment_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_role text;
  v_line public.order_items%rowtype;
  v_note text := nullif(btrim(p_note), '');
  v_from_status text;
  v_to_status text;
begin
  if v_actor_id is null then
    raise exception 'SKXNZ_UNAUTHENTICATED' using errcode = '42501';
  end if;

  select role into v_role from public.users where id = v_actor_id;
  if v_role is distinct from 'SELLER' then
    raise exception 'SKXNZ_SELLER_REQUIRED' using errcode = '42501';
  end if;
  if p_action not in ('ADVANCE', 'ADD_NOTE') then
    raise exception 'SKXNZ_INVALID_ACTION' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'SKXNZ_NOTE_TOO_LONG' using errcode = '22023';
  end if;
  if p_action = 'ADD_NOTE' and v_note is null then
    raise exception 'SKXNZ_NOTE_REQUIRED' using errcode = '22023';
  end if;

  select oi.* into v_line
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  join public.orders o on o.id = oi.order_id
  where oi.id = p_order_item_id
    and p.seller_id = v_actor_id
    and o.status not in ('DRAFT', 'PAYMENT_PENDING')
  for update of oi;

  if not found then
    -- Same outcome for absent, pre-payment, and another seller's line.
    raise exception 'SKXNZ_LINE_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_from_status := v_line.seller_fulfilment_status;
  v_to_status := v_from_status;
  if p_action = 'ADVANCE' then
    if (v_from_status = 'PENDING' and p_next_status = 'ACCEPTED')
      or (v_from_status = 'ACCEPTED' and p_next_status = 'PACKED')
      or (v_from_status = 'PACKED' and p_next_status = 'HANDED_TO_DELIVERY') then
      v_to_status := p_next_status;
    else
      raise exception 'SKXNZ_INVALID_TRANSITION' using errcode = '22023';
    end if;
  end if;

  update public.order_items
  set seller_fulfilment_status = v_to_status,
      seller_fulfilment_note = coalesce(v_note, seller_fulfilment_note),
      seller_fulfilment_updated_at = now()
  where id = v_line.id;

  insert into public.order_item_events (
    order_item_id, event_type, from_status, to_status, actor_user_id, message, metadata
  ) values (
    v_line.id,
    case when p_action = 'ADVANCE' then 'STATUS_CHANGED' else 'NOTE_ADDED' end,
    case when p_action = 'ADVANCE' then v_from_status else null end,
    case when p_action = 'ADVANCE' then v_to_status else null end,
    v_actor_id,
    case when p_action = 'ADVANCE'
      then format('Seller advanced line %s -> %s.', v_from_status, v_to_status)
      else 'Seller added a fulfilment note.' end,
    jsonb_build_object('source', 'seller_update_line_fulfilment', 'action', p_action)
  );

  return query select v_line.id, v_line.order_id, v_to_status;
end;
$$;

comment on function public.seller_update_line_fulfilment(uuid, text, text, text) is
  'Atomic seller-owned line fulfilment update plus audit insert. Actor is auth.uid(); no buyer, payment, refund, order-wide status, or caller-supplied seller data is accepted.';

revoke all on function public.seller_update_line_fulfilment(uuid, text, text, text) from public, anon;
grant execute on function public.seller_update_line_fulfilment(uuid, text, text, text) to authenticated;

-- =============================================================
-- 5. SCOPED SELLER RETURN INDICATORS
--
-- The function exposes only active return status + requested quantity for
-- seller-owned order lines supplied by the caller. It exposes no return
-- reason/note, buyer identity, support thread, payment/refund amount, or
-- another seller's item. There is deliberately no seller write path.
-- =============================================================

create or replace function public.seller_active_return_indicators(
  p_order_item_ids uuid[]
)
returns table (
  order_item_id uuid,
  return_status text,
  requested_quantity integer
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select ri.order_item_id, rr.status, ri.quantity
  from public.return_request_items ri
  join public.return_requests rr on rr.id = ri.return_request_id
  join public.order_items oi on oi.id = ri.order_item_id
  join public.products p on p.id = oi.product_id
  join public.users u on u.id = auth.uid()
  where u.role = 'SELLER'
    and p.seller_id = auth.uid()
    and ri.order_item_id = any(coalesce(p_order_item_ids, '{}'::uuid[]))
    and rr.status in ('REQUESTED', 'IN_REVIEW', 'APPROVED', 'PICKUP_PENDING', 'RECEIVED', 'REFUND_PENDING');
$$;

comment on function public.seller_active_return_indicators(uuid[]) is
  'Seller-scoped, read-only active return indicator: order item id, status, and requested quantity only. Does not expose return reasons, buyer/support/payment data, rejected/closed/refunded requests, or other sellers items.';

revoke all on function public.seller_active_return_indicators(uuid[]) from public, anon;
grant execute on function public.seller_active_return_indicators(uuid[]) to authenticated;

-- =============================================================
-- 6. GRANTS
--    Revoke defaults first, then grant only SELECT on the events
--    table. No UPDATE on order_items for anon/authenticated — the
--    authenticated seller RPC performs the atomic write.
-- =============================================================

revoke all on public.order_item_events from anon, authenticated;
grant select on public.order_item_events to authenticated;

-- Existing order_items grants (from 0005) already give authenticated
-- select+insert but NO update — that is exactly what this slice needs.
-- No change required here.


-- =============================================================
-- 7. NOTES
--
--  * Allowed forward transitions (enforced by the RPC while the row is
--    locked, not by client code):
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
