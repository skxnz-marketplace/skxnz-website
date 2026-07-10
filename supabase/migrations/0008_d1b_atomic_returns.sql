-- D1-B atomic return claim boundary. Apply separately; no live SQL was run.
alter table public.return_requests add constraint return_requests_reason_length_d1b check (char_length(btrim(reason)) between 1 and 500) not valid;
alter table public.return_requests add constraint return_requests_note_length_d1b check (note is null or char_length(note) <= 2000) not valid;
alter table public.return_request_items add constraint return_request_items_reason_length_d1b check (reason is null or char_length(reason) <= 500) not valid;
revoke insert on public.return_requests, public.return_request_items from authenticated;
drop policy if exists "return_requests: buyer can insert own requested" on public.return_requests;
drop policy if exists "return_request_items: buyer can insert own" on public.return_request_items;
-- The production RPC must lock the delivered order, validate all item ownership and remaining
-- quantities, then insert request/items/event in one transaction. It is intentionally supplied
-- as a draft migration for operator review and is not executed by this commit.

create or replace function public.create_return_request_atomic(p_order_id uuid,p_reason text,p_note text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public volatile as $$
declare v_buyer uuid:=auth.uid(); v_status text; v_req uuid; v record; v_purchased int; v_claimed bigint;
begin
 if v_buyer is null then return jsonb_build_object('ok',false,'code','UNAUTHENTICATED'); end if;
 if p_order_id is null or char_length(btrim(coalesce(p_reason,''))) not between 1 and 500 or char_length(coalesce(p_note,''))>2000 then return jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); end if;
 if jsonb_typeof(p_items) is distinct from 'array' then return jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); end if;
 if jsonb_array_length(p_items) not between 1 and 50 then return jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); end if;
 if exists(select 1 from jsonb_array_elements(p_items) j(v) where jsonb_typeof(v)<>'object' or jsonb_typeof(v->'order_item_id')<>'string' or jsonb_typeof(v->'quantity')<>'number' or coalesce(v->>'quantity','') !~ '^[1-9][0-9]{0,9}$') then return jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); end if;
 select status into v_status from public.orders where id=p_order_id and buyer_id=v_buyer for update;
 if not found then return jsonb_build_object('ok',false,'code','ORDER_NOT_FOUND'); end if;
 if v_status<>'DELIVERED' then return jsonb_build_object('ok',false,'code','NOT_ELIGIBLE'); end if;
 for v in select (x->>'order_item_id')::uuid item_id,(x->>'quantity')::int qty from jsonb_array_elements(p_items) j(x) loop
   select quantity into v_purchased from public.order_items where id=v.item_id and order_id=p_order_id for update;
   if not found then return jsonb_build_object('ok',false,'code','ITEM_MISMATCH'); end if;
   select coalesce(sum(i.quantity),0) into v_claimed from public.return_request_items i join public.return_requests r on r.id=i.return_request_id where r.order_id=p_order_id and r.status<>'REJECTED' and i.order_item_id=v.item_id;
   if v.qty>v_purchased-v_claimed then return jsonb_build_object('ok',false,'code','QUANTITY_EXCEEDED'); end if;
 end loop;
 insert into public.return_requests(order_id,buyer_id,status,reason,note) values(p_order_id,v_buyer,'REQUESTED',btrim(p_reason),nullif(btrim(coalesce(p_note,'')),'')) returning id into v_req;
 insert into public.return_request_items(return_request_id,order_item_id,quantity,reason) select v_req,(x->>'order_item_id')::uuid,(x->>'quantity')::int,nullif(btrim(coalesce(x->>'reason','')),'') from jsonb_array_elements(p_items) j(x);
 insert into public.order_events(order_id,event_type,message,metadata) values(p_order_id,'RETURN_REQUESTED','Return request submitted for review.',jsonb_build_object('return_request_id',v_req,'source','create_return_request_atomic'));
 return jsonb_build_object('ok',true,'code','CREATED','return_request_id',v_req,'status','REQUESTED');
end; $$;
revoke all on function public.create_return_request_atomic(uuid,text,text,jsonb) from public,anon;
grant execute on function public.create_return_request_atomic(uuid,text,text,jsonb) to authenticated;

