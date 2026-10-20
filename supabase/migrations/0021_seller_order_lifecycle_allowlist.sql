-- 0021 candidate ONLY: seller lifecycle allow-list. NOT APPLIED.
-- Review and approve separately. Replaces three functions; no table/data/policy/grant changes.
-- Reads retain completed paid orders for seller history/returns; DRAFT, PAYMENT_PENDING,
-- CANCELLED and REFUNDED are excluded. ADVANCE only while PAID/FULFILLING.
-- CREATE OR REPLACE preserves existing function ownership and EXECUTE ACLs.

create or replace function public.seller_owns_post_payment_order_line(
  p_order_id   uuid,
  p_product_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.orders o
    join public.products p on p.id = p_product_id
    where o.id = p_order_id
      and p.seller_id = auth.uid()
      and o.status in ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED')
  );
$$;

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
    and o.status in ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED')
    and (p_action = 'ADD_NOTE' or o.status in ('PAID', 'FULFILLING'))
  for update of oi, o;

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
  join public.orders o on o.id = oi.order_id
  join public.users u on u.id = auth.uid()
  where o.status in ('PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED')
    and u.role = 'SELLER'
    and p.seller_id = auth.uid()
    and ri.order_item_id = any(coalesce(p_order_item_ids, '{}'::uuid[]))
    and rr.status in ('REQUESTED', 'IN_REVIEW', 'APPROVED', 'PICKUP_PENDING', 'RECEIVED', 'REFUND_PENDING');
$$;

comment on function public.seller_owns_post_payment_order_line(uuid,uuid) is
  'Seller-owned lines in PAID/FULFILLING/SHIPPED/DELIVERED orders only; excludes unpaid, cancelled and refunded orders without exposing buyer data.';
