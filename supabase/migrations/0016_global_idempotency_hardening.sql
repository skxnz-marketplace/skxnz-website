-- SKXNZ Day 12-A: global idempotency hardening (DRAFT ONLY).
-- Do not execute live from this commit. Operator must review/apply in disposable QA first.

-- ---------------------------------------------------------------------------
-- 1. Shared idempotency metadata for buyer-created multi-row workflows.
-- ---------------------------------------------------------------------------
alter table public.support_tickets add column if not exists idempotency_key uuid;
alter table public.support_tickets add column if not exists idempotency_fingerprint text;
create unique index if not exists support_tickets_buyer_idempotency_key_unique
  on public.support_tickets (buyer_id, idempotency_key)
  where idempotency_key is not null;

alter table public.support_ticket_messages add column if not exists idempotency_key uuid;
alter table public.support_ticket_messages add column if not exists idempotency_fingerprint text;
create unique index if not exists support_ticket_messages_sender_idempotency_key_unique
  on public.support_ticket_messages (sender_id, idempotency_key)
  where idempotency_key is not null;

alter table public.return_requests add column if not exists idempotency_key uuid;
alter table public.return_requests add column if not exists idempotency_fingerprint text;
create unique index if not exists return_requests_buyer_idempotency_key_unique
  on public.return_requests (buyer_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 2. Buyer support ticket: ticket + opening message in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.create_support_ticket_idempotent(
  p_category text,
  p_subject text,
  p_message text,
  p_order_id uuid,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer uuid := auth.uid();
  v_existing public.support_tickets%rowtype;
  v_ticket_id uuid;
  v_fingerprint text;
begin
  if v_buyer is null then return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); end if;
  if p_idempotency_key is null
    or p_category not in ('ORDER','RETURN','PAYMENT','DELIVERY','PRODUCT','ACCOUNT','OTHER')
    or char_length(btrim(coalesce(p_subject,''))) not between 1 and 160
    or char_length(btrim(coalesce(p_message,''))) not between 1 and 4000 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end if;
  if p_order_id is not null and not exists (
    select 1 from public.orders where id = p_order_id and buyer_id = v_buyer
  ) then
    return jsonb_build_object('ok', false, 'code', 'ORDER_NOT_FOUND');
  end if;

  v_fingerprint := md5(p_category || '|' || btrim(p_subject) || '|' || btrim(p_message) || '|' || coalesce(p_order_id::text,''));
  select * into v_existing from public.support_tickets
  where buyer_id = v_buyer and idempotency_key = p_idempotency_key
  for update;
  if found then
    if v_existing.idempotency_fingerprint = v_fingerprint then
      return jsonb_build_object('ok', true, 'ticket_id', v_existing.id, 'status', v_existing.status, 'reused', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_CONFLICT');
  end if;

  insert into public.support_tickets(
    buyer_id, order_id, category, status, subject, idempotency_key, idempotency_fingerprint
  ) values (
    v_buyer, p_order_id, p_category, 'OPEN', btrim(p_subject), p_idempotency_key, v_fingerprint
  ) returning id into v_ticket_id;

  insert into public.support_ticket_messages(ticket_id, sender_id, sender_role, message, metadata)
  values(v_ticket_id, v_buyer, 'BUYER', btrim(p_message), jsonb_build_object('source','create_support_ticket_idempotent'));

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket_id, 'status', 'OPEN', 'reused', false);
end;
$$;
revoke all on function public.create_support_ticket_idempotent(text,text,text,uuid,uuid) from public, anon;
grant execute on function public.create_support_ticket_idempotent(text,text,text,uuid,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Support message append: duplicate submit returns same message.
-- ---------------------------------------------------------------------------
create or replace function public.add_support_ticket_message_idempotent(
  p_ticket_id uuid,
  p_message text,
  p_sender_role text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sender uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
  v_existing public.support_ticket_messages%rowtype;
  v_message_id uuid;
  v_fingerprint text;
begin
  if v_sender is null then return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); end if;
  if p_idempotency_key is null or p_sender_role <> 'BUYER' or char_length(btrim(coalesce(p_message,''))) not between 1 and 4000 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end if;
  select * into v_ticket from public.support_tickets where id = p_ticket_id and buyer_id = v_sender for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); end if;
  if v_ticket.status not in ('OPEN','WAITING_FOR_CUSTOMER','IN_REVIEW') then
    return jsonb_build_object('ok', false, 'code', 'TICKET_NOT_ACTIVE');
  end if;

  v_fingerprint := md5(p_ticket_id::text || '|BUYER|' || btrim(p_message));
  select * into v_existing from public.support_ticket_messages
  where sender_id = v_sender and idempotency_key = p_idempotency_key
  for update;
  if found then
    if v_existing.idempotency_fingerprint = v_fingerprint then
      return jsonb_build_object('ok', true, 'message_id', v_existing.id, 'reused', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_CONFLICT');
  end if;

  insert into public.support_ticket_messages(
    ticket_id, sender_id, sender_role, message, metadata, idempotency_key, idempotency_fingerprint
  ) values (
    p_ticket_id, v_sender, 'BUYER', btrim(p_message), jsonb_build_object('source','add_support_ticket_message_idempotent'), p_idempotency_key, v_fingerprint
  ) returning id into v_message_id;
  return jsonb_build_object('ok', true, 'message_id', v_message_id, 'reused', false);
end;
$$;
revoke all on function public.add_support_ticket_message_idempotent(uuid,text,text,uuid) from public, anon;
grant execute on function public.add_support_ticket_message_idempotent(uuid,text,text,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Return request: request + items + event in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.create_return_request_idempotent(
  p_order_id uuid,
  p_reason text,
  p_note text,
  p_items jsonb,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer uuid := auth.uid();
  v_status text;
  v_existing public.return_requests%rowtype;
  v_req uuid;
  v_fingerprint text;
  v record;
  v_purchased int;
  v_claimed bigint;
begin
  if v_buyer is null then return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); end if;
  if p_idempotency_key is null
    or p_order_id is null
    or char_length(btrim(coalesce(p_reason,''))) not between 1 and 500
    or char_length(coalesce(p_note,'')) > 2000
    or jsonb_typeof(p_items) is distinct from 'array'
    or jsonb_array_length(p_items) not between 1 and 50 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) j(v)
    where jsonb_typeof(v) <> 'object'
      or jsonb_typeof(v->'order_item_id') <> 'string'
      or jsonb_typeof(v->'quantity') <> 'number'
      or coalesce(v->>'quantity','') !~ '^[1-9][0-9]{0,9}$'
  ) then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); end if;
  if exists (select 1 from jsonb_array_elements(p_items) j(v) group by v->>'order_item_id' having count(*) > 1) then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end if;

  select status into v_status from public.orders where id = p_order_id and buyer_id = v_buyer for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'ORDER_NOT_FOUND'); end if;
  if v_status <> 'DELIVERED' then return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE'); end if;

  v_fingerprint := md5(p_order_id::text || '|' || btrim(p_reason) || '|' || coalesce(btrim(p_note),'') || '|' || p_items::text);
  select * into v_existing from public.return_requests
  where buyer_id = v_buyer and idempotency_key = p_idempotency_key
  for update;
  if found then
    if v_existing.idempotency_fingerprint = v_fingerprint then
      return jsonb_build_object('ok', true, 'return_request_id', v_existing.id, 'status', v_existing.status, 'reused', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_CONFLICT');
  end if;

  for v in
    select (x->>'order_item_id')::uuid item_id, (x->>'quantity')::int qty
    from jsonb_array_elements(p_items) j(x)
    order by (x->>'order_item_id')::uuid
  loop
    select quantity into v_purchased from public.order_items where id = v.item_id and order_id = p_order_id for update;
    if not found then return jsonb_build_object('ok', false, 'code', 'ITEM_MISMATCH'); end if;
    select coalesce(sum(i.quantity), 0) into v_claimed
    from public.return_request_items i
    join public.return_requests r on r.id = i.return_request_id
    where r.order_id = p_order_id and r.status <> 'REJECTED' and i.order_item_id = v.item_id;
    if v_purchased - v_claimed <= 0 then return jsonb_build_object('ok', false, 'code', 'ALREADY_REQUESTED'); end if;
    if v.qty > v_purchased - v_claimed then return jsonb_build_object('ok', false, 'code', 'QUANTITY_EXCEEDED'); end if;
  end loop;

  insert into public.return_requests(order_id,buyer_id,status,reason,note,idempotency_key,idempotency_fingerprint)
  values(p_order_id,v_buyer,'REQUESTED',btrim(p_reason),nullif(btrim(coalesce(p_note,'')),''),p_idempotency_key,v_fingerprint)
  returning id into v_req;

  insert into public.return_request_items(return_request_id,order_item_id,quantity,reason)
  select v_req,(x->>'order_item_id')::uuid,(x->>'quantity')::int,nullif(btrim(coalesce(x->>'reason','')),'')
  from jsonb_array_elements(p_items) j(x);

  insert into public.order_events(order_id,event_type,message,metadata)
  values(p_order_id,'RETURN_REQUESTED','Return request submitted for review.',jsonb_build_object('return_request_id',v_req,'source','create_return_request_idempotent'));

  return jsonb_build_object('ok', true, 'return_request_id', v_req, 'status', 'REQUESTED', 'reused', false);
end;
$$;
revoke all on function public.create_return_request_idempotent(uuid,text,text,jsonb,uuid) from public, anon;
grant execute on function public.create_return_request_idempotent(uuid,text,text,jsonb,uuid) to authenticated;
