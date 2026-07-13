-- SKXNZ D4-B: atomic admin commerce mutations (DRAFT ONLY; do not apply here).
-- Each RPC derives the actor from auth.uid(), requires ADMIN, locks the
-- resource, validates the current transition, updates it and appends the
-- matching order_events audit row in one transaction.
-- 0005 models these statuses as checked text columns, not PostgreSQL enums;
-- the transition allow-lists below are therefore the explicit type boundary.

create or replace function public.admin_update_order_status_atomic(p_order_id uuid, p_next_status text, p_note text default null)
returns table(order_id uuid, status text) language plpgsql security definer set search_path = public, pg_temp as $$
declare a uuid := auth.uid(); r text; o public.orders%rowtype; n text := nullif(btrim(p_note),'');
begin
  if a is null then raise exception 'SKXNZ_UNAUTHENTICATED' using errcode='42501'; end if;
  select role into r from public.users where id=a; if r is distinct from 'ADMIN' then raise exception 'SKXNZ_ADMIN_REQUIRED' using errcode='42501'; end if;
  if n is not null and char_length(n)>500 then raise exception 'SKXNZ_NOTE_TOO_LONG' using errcode='22023'; end if;
  select * into o from public.orders where id=p_order_id for update; if not found then raise exception 'SKXNZ_ORDER_NOT_FOUND' using errcode='P0002'; end if;
  if not ((o.status in ('DRAFT','PAYMENT_PENDING') and p_next_status='CANCELLED') or (o.status='PAID' and p_next_status in ('FULFILLING','CANCELLED')) or (o.status='FULFILLING' and p_next_status in ('SHIPPED','CANCELLED')) or (o.status='SHIPPED' and p_next_status='DELIVERED')) then raise exception 'SKXNZ_INVALID_TRANSITION' using errcode='22023'; end if;
  update public.orders set status=p_next_status where id=o.id;
  insert into public.order_events(order_id,event_type,message,metadata) values(o.id,'STATUS_CHANGED',coalesce(n,format('Status changed %s -> %s by admin.',o.status,p_next_status)),jsonb_build_object('source','admin_update_order_status_atomic','actor_user_id',a,'from_status',o.status,'to_status',p_next_status));
  return query select o.id,p_next_status;
end $$;

create or replace function public.admin_update_return_status_atomic(p_request_id uuid, p_next_status text, p_note text default null)
returns table(request_id uuid, status text) language plpgsql security definer set search_path = public, pg_temp as $$
declare a uuid := auth.uid(); r text; q public.return_requests%rowtype; n text := nullif(btrim(p_note),'');
begin
  if a is null then raise exception 'SKXNZ_UNAUTHENTICATED' using errcode='42501'; end if;
  select role into r from public.users where id=a; if r is distinct from 'ADMIN' then raise exception 'SKXNZ_ADMIN_REQUIRED' using errcode='42501'; end if;
  if n is not null and char_length(n)>500 then raise exception 'SKXNZ_NOTE_TOO_LONG' using errcode='22023'; end if;
  select * into q from public.return_requests where id=p_request_id for update; if not found then raise exception 'SKXNZ_RETURN_NOT_FOUND' using errcode='P0002'; end if;
  if not ((q.status='REQUESTED' and p_next_status in ('IN_REVIEW','REJECTED')) or (q.status='IN_REVIEW' and p_next_status in ('APPROVED','REJECTED'))) then raise exception 'SKXNZ_INVALID_TRANSITION' using errcode='22023'; end if;
  update public.return_requests set status=p_next_status where id=q.id;
  insert into public.order_events(order_id,event_type,message,metadata) values(q.order_id,'RETURN_STATUS_UPDATED',coalesce(n,format('Return request moved %s -> %s by admin.',q.status,p_next_status)),jsonb_build_object('source','admin_update_return_status_atomic','actor_user_id',a,'return_request_id',q.id,'from_status',q.status,'to_status',p_next_status));
  return query select q.id,p_next_status;
end $$;

revoke all on function public.admin_update_order_status_atomic(uuid,text,text) from public, anon;
revoke all on function public.admin_update_return_status_atomic(uuid,text,text) from public, anon;
grant execute on function public.admin_update_order_status_atomic(uuid,text,text) to authenticated;
grant execute on function public.admin_update_return_status_atomic(uuid,text,text) to authenticated;
