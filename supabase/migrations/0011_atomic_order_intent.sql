-- SKXNZ D5-A: atomic DRAFT order intent + idempotency (DRAFT ONLY).
-- Depends on 0001, the externally-applied catalog baseline (products,
-- product_variants), and 0005 commerce tables. Do not apply here.
alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add column if not exists idempotency_fingerprint text;
create unique index if not exists orders_buyer_idempotency_key_unique
  on public.orders (buyer_id, idempotency_key) where idempotency_key is not null;

create or replace function public.create_order_intent_atomic(
  p_items jsonb, p_shipping_address_id uuid, p_note text, p_idempotency_key uuid
) returns table(order_id uuid, status text, reused boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_buyer uuid := auth.uid(); v_role text; v_existing public.orders%rowtype;
  v_order_id uuid; v_fingerprint text; v_line jsonb; v_product public.products%rowtype;
  v_variant public.product_variants%rowtype; v_address public.addresses%rowtype;
  v_qty integer; v_product_id uuid; v_variant_id uuid; v_subtotal integer := 0;
  v_price integer; v_has_variants boolean; v_note text := nullif(btrim(coalesce(p_note,'')), '');
begin
  if v_buyer is null then raise exception 'SKXNZ_UNAUTHENTICATED' using errcode='42501'; end if;
  select role into v_role from public.users where id=v_buyer;
  if v_role is distinct from 'BUYER' then raise exception 'SKXNZ_BUYER_REQUIRED' using errcode='42501'; end if;
  if p_idempotency_key is null or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 50 or (v_note is not null and char_length(v_note)>500) then
    raise exception 'SKXNZ_VALIDATION_FAILED' using errcode='22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) elem(value)
    where jsonb_typeof(value) <> 'object' or coalesce(value->>'quantity','') !~ '^[1-9]$|^10$'
      or ((value->>'product_id') is null and nullif(btrim(coalesce(value->>'product_slug','')), '') is null)) then
    raise exception 'SKXNZ_VALIDATION_FAILED' using errcode='22023';
  end if;
  v_fingerprint := md5(p_items::text || '|' || p_shipping_address_id::text || '|' || coalesce(v_note,''));
  select * into v_existing from public.orders where buyer_id=v_buyer and idempotency_key=p_idempotency_key for update;
  if found then
    if v_existing.idempotency_fingerprint = v_fingerprint and v_existing.status='DRAFT' then return query select v_existing.id, v_existing.status, true; return; end if;
    raise exception 'SKXNZ_IDEMPOTENCY_CONFLICT' using errcode='22023';
  end if;
  select * into v_address from public.addresses where id=p_shipping_address_id and user_id=v_buyer for update;
  if not found then raise exception 'SKXNZ_ADDRESS_NOT_FOUND' using errcode='P0002'; end if;

  -- Resolve and lock in caller-independent product-id order to avoid lock-order
  -- deadlocks. The per-line pass below rechecks every requested association.
  perform 1 from public.products p where p.id in (
    select (value->>'product_id')::uuid from jsonb_array_elements(p_items) elem(value)
    where value ? 'product_id' and (value->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f-]{27}$'
  ) order by p.id for update;
  for v_line in select value from jsonb_array_elements(p_items) order by coalesce(value->>'product_id', value->>'product_slug'), coalesce(value->>'variant_id','') loop
    v_qty := (v_line->>'quantity')::integer;
    if v_line ? 'product_id' then
      if (v_line->>'product_id') !~* '^[0-9a-f]{8}-[0-9a-f-]{27}$' then raise exception 'SKXNZ_VALIDATION_FAILED' using errcode='22023'; end if;
      v_product_id := (v_line->>'product_id')::uuid;
      select * into v_product from public.products where id=v_product_id for update;
    else
      select * into v_product from public.products where slug=v_line->>'product_slug' for update;
    end if;
    if not found or v_product.status <> 'ACTIVE' then raise exception 'SKXNZ_PRODUCT_UNAVAILABLE' using errcode='22023'; end if;
    select exists(select 1 from public.product_variants where product_id=v_product.id and is_active=true) into v_has_variants;
    v_variant_id := null;
    if nullif(v_line->>'variant_id','') is not null then
      if (v_line->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f-]{27}$' then raise exception 'SKXNZ_VALIDATION_FAILED' using errcode='22023'; end if;
      v_variant_id := (v_line->>'variant_id')::uuid;
      select * into v_variant from public.product_variants where id=v_variant_id and product_id=v_product.id and is_active=true for update;
      if not found then raise exception 'SKXNZ_VARIANT_UNAVAILABLE' using errcode='22023'; end if;
      if v_variant.stock_quantity < v_qty then raise exception 'SKXNZ_OUT_OF_STOCK' using errcode='22023'; end if;
      v_price := round(coalesce(v_variant.price_inr, v_product.price_inr, 0) * 100)::integer;
    elsif v_has_variants then raise exception 'SKXNZ_VARIANT_UNAVAILABLE' using errcode='22023';
    else v_price := round(coalesce(v_product.price_inr, 0) * 100)::integer;
    end if;
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;
  insert into public.orders(buyer_id,status,currency,subtotal_amount_paise,contact_snapshot,shipping_address_snapshot,delivery_note,idempotency_key,idempotency_fingerprint)
  values(v_buyer,'DRAFT','INR',v_subtotal,jsonb_build_object('fullName',coalesce(v_address.full_name,''),'phone',coalesce(v_address.phone_number,''),'email',coalesce((select email from public.users where id=v_buyer),'')),jsonb_build_object('line1',v_address.line1,'line2',v_address.line2,'city',v_address.city,'state',v_address.state,'pincode',v_address.postal_code,'country',v_address.country),v_note,p_idempotency_key,v_fingerprint)
  on conflict (buyer_id,idempotency_key) where idempotency_key is not null do nothing returning id into v_order_id;
  if v_order_id is null then
    select * into v_existing from public.orders where buyer_id=v_buyer and idempotency_key=p_idempotency_key for update;
    if v_existing.idempotency_fingerprint=v_fingerprint and v_existing.status='DRAFT' then return query select v_existing.id,v_existing.status,true; return; end if;
    raise exception 'SKXNZ_IDEMPOTENCY_CONFLICT' using errcode='22023';
  end if;
  for v_line in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_line->>'quantity')::integer;
    if v_line ? 'product_id' then select * into v_product from public.products where id=(v_line->>'product_id')::uuid; else select * into v_product from public.products where slug=v_line->>'product_slug'; end if;
    v_variant_id := nullif(v_line->>'variant_id','')::uuid;
    if v_variant_id is not null then select * into v_variant from public.product_variants where id=v_variant_id; end if;
    v_price := round(coalesce(v_variant.price_inr,v_product.price_inr,0)*100)::integer;
    insert into public.order_items(order_id,product_id,product_slug,variant_id,title_snapshot,image_snapshot,selected_size,selected_color,unit_price_paise,quantity,line_total_paise)
    values(v_order_id,v_product.id,v_product.slug,v_variant_id,v_product.name,v_product.image_url,case when v_variant_id is null then null else v_variant.size end,case when v_variant_id is null then null else v_variant.color end,v_price,v_qty,v_price*v_qty);
  end loop;
  insert into public.order_events(order_id,event_type,message,metadata) values(v_order_id,'ORDER_CREATED','Buyer created a draft order.',jsonb_build_object('source','create_order_intent_atomic','buyer_user_id',v_buyer,'line_count',jsonb_array_length(p_items)));
  return query select v_order_id,'DRAFT'::text,false;
end $$;

revoke all on function public.create_order_intent_atomic(jsonb,uuid,text,uuid) from public, anon;
grant execute on function public.create_order_intent_atomic(jsonb,uuid,text,uuid) to authenticated;
