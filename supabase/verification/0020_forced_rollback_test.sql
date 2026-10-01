-- SKXNZ 0020 forced-rollback validation (run 2026-10-01 against hhsorrkvgvxxpwzrggei).
--
-- Applies the exact text of 0020_reconcile_missing_commerce_objects.sql inside one DO
-- block, exercises every new object as synthetic buyer/seller/admin/anon users with
-- synthetic products, then RAISEs the result so the whole transaction rolls back.
-- Nothing persists. The first token of the result is md5(<migration text>); it must
-- equal the md5 of the migration file, or the run did not test that file.
-- If the migration file changes, regenerate this script from it.
do $t$
declare
  m text := $mig$-- SKXNZ 0020: forward-only catch-up of commerce objects missing from production.
--
-- Why: the live project (hhsorrkvgvxxpwzrggei) was audited read-only on 2026-10-01
-- (docs/engineering/DB_RECONCILIATION_2026-10-01.md). Its commerce schema matches
-- migrations 0005 + 0006 exactly; nothing from 0007, 0008, 0009, 0010, 0011 or 0016 was
-- ever applied, while the application code calls those objects. This migration
-- creates only the objects proven missing. It does not replay, mark or repair the
-- historical migrations; those files stay as the record of intended schema.
--
-- Each section below is copied verbatim from the named migration, except:
--   * 0007 / 0009 / 0010 / 0011 / 0016: file headers omitted, bodies unchanged.
--   * 0008: return_request_items.reason already exists live, so that ADD COLUMN is
--     omitted; each ADD CONSTRAINT gets a DROP CONSTRAINT IF EXISTS guard; the draft
--     function create_return_request_atomic is NOT created (the app never calls it;
--     create_return_request_idempotent from 0016 supersedes it).
--   * 0016: create_return_request_idempotent had a defect: its validation subqueries
--     aliased JSON elements as "v", which collides with its record variable "v", so
--     every call failed with 42702 (found by the 2026-10-01 forced-rollback test). The
--     alias is renamed to "e" in those two subqueries; nothing else in it changes.
--   * 0011: create_order_intent_atomic stored wrong line prices. Its second pass never
--     cleared v_variant, so a line without an option took the option price of an earlier
--     line (subtotal stayed right, line prices did not; found by the 2026-10-01 pricing
--     test). 0020 clears v_variant for such lines and adds a SKXNZ_PRICE_MISMATCH guard
--     that rejects the order if stored line totals do not add up to the subtotal.
--
-- Every commerce table touched is empty in production at audit time (0 rows), so no
-- existing data is rewritten. Depends only on objects verified present live:
-- users, addresses, products, product_variants, orders, order_items, order_events,
-- support_tickets, support_ticket_messages, return_requests, return_request_items,
-- set_updated_at(), is_admin(), seller_owns_post_payment_order_line().

-- ===========================================================================
-- From 0007_buyer_saved_items.sql: buyer saved items
-- ===========================================================================
create table if not exists public.saved_items (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  product_id          uuid,
  product_slug        text        not null,
  product_title       text        not null,
  brand_name          text,
  price_inr           integer     check (price_inr is null or price_inr >= 0),
  image_url           text,
  selected_size       text,
  selected_variant_id uuid,
  source              text        not null default 'live'
                                  check (source in ('live', 'demo')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.saved_items is
  'Buyer wishlist / save-for-later. Self-contained product snapshot owned by one buyer via RLS. price_inr is whole rupees (display snapshot), matching public.products.';

-- Dedupe: one saved row per buyer + slug + size + variant. COALESCE keeps
-- NULL size/variant from creating unbounded duplicates of the same product.
create unique index if not exists saved_items_unique_per_buyer_idx
  on public.saved_items (
    user_id,
    product_slug,
    coalesce(selected_size, ''),
    coalesce(selected_variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists saved_items_user_id_idx on public.saved_items (user_id);
create index if not exists saved_items_product_id_idx on public.saved_items (product_id);


-- =============================================================
-- 2. UPDATED_AT TRIGGER (reuses public.set_updated_at from 0001)
-- =============================================================

drop trigger if exists saved_items_set_updated_at on public.saved_items;
create trigger saved_items_set_updated_at
  before update on public.saved_items
  for each row execute function public.set_updated_at();


-- =============================================================
-- 3. GRANTS
--    Supabase grants ALL on new public tables to anon + authenticated by
--    default. Revoke everything, then grant only the minimal surface:
--    a signed-in buyer may read / add / remove their own saved items.
--    No UPDATE grant (a saved item is immutable; re-saving = delete+insert).
-- =============================================================

revoke all on public.saved_items from anon, authenticated;
grant select, insert, delete on public.saved_items to authenticated;


-- =============================================================
-- 4. ROW LEVEL SECURITY
--    Buyer owns their own rows only. Admin read via the SECURITY DEFINER
--    public.is_admin() helper (same pattern as the rest of the schema).
--    Buyers can never write another buyer's rows: every insert is checked
--    against auth.uid(), and there is no UPDATE policy at all.
-- =============================================================

alter table public.saved_items enable row level security;

-- A buyer can read only their own saved items.
drop policy if exists "saved_items: owner can select" on public.saved_items;
create policy "saved_items: owner can select"
  on public.saved_items
  for select
  using (auth.uid() = user_id);

-- Admin read-only inspection (mirrors the admin read pattern elsewhere).
drop policy if exists "saved_items: admin can select" on public.saved_items;
create policy "saved_items: admin can select"
  on public.saved_items
  for select
  using (public.is_admin());

-- A buyer can save a new item for THEMSELVES only. user_id is forced to
-- match the session; the client can never write someone else's user_id.
drop policy if exists "saved_items: owner can insert" on public.saved_items;
create policy "saved_items: owner can insert"
  on public.saved_items
  for insert
  with check (auth.uid() = user_id);

-- A buyer can remove only their own saved items.
drop policy if exists "saved_items: owner can delete" on public.saved_items;
create policy "saved_items: owner can delete"
  on public.saved_items
  for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Intentionally NOT added: any UPDATE policy/grant, any anon access,
-- any service_role logic. Stock, payment, and delivery are unaffected —
-- this table stores a display snapshot only, no promises.
-- =============================================================

-- ===========================================================================
-- From 0008_d1b_atomic_returns.sql: return constraints; direct buyer inserts closed
-- ===========================================================================
alter table public.return_requests drop constraint if exists return_requests_reason_length_d1b;
alter table public.return_requests add constraint return_requests_reason_length_d1b check (char_length(btrim(reason)) between 1 and 500) not valid;
alter table public.return_requests drop constraint if exists return_requests_note_length_d1b;
alter table public.return_requests add constraint return_requests_note_length_d1b check (note is null or char_length(note) <= 2000) not valid;
alter table public.return_request_items drop constraint if exists return_request_items_reason_length_d1b;
alter table public.return_request_items add constraint return_request_items_reason_length_d1b check (reason is null or char_length(reason) <= 500) not valid;
revoke insert on public.return_requests, public.return_request_items from authenticated;
drop policy if exists "return_requests: buyer can insert own requested" on public.return_requests;
drop policy if exists "return_request_items: buyer can insert own" on public.return_request_items;

-- ===========================================================================
-- From 0009_seller_line_fulfilment.sql: seller line fulfilment
-- ===========================================================================
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

-- ===========================================================================
-- From 0010_admin_commerce_atomic_actions.sql: admin atomic status changes
-- ===========================================================================
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

-- ===========================================================================
-- From 0011_atomic_order_intent.sql: atomic order intent + idempotency
-- ===========================================================================
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
    -- 0020 fix: clear v_variant on lines without an option. It used to keep the previous
    -- line's variant, so a plain line could be stored at another line's option price.
    if v_variant_id is not null then select * into v_variant from public.product_variants where id=v_variant_id; else v_variant := null::public.product_variants; end if;
    v_price := round(coalesce(v_variant.price_inr,v_product.price_inr,0)*100)::integer;
    insert into public.order_items(order_id,product_id,product_slug,variant_id,title_snapshot,image_snapshot,selected_size,selected_color,unit_price_paise,quantity,line_total_paise)
    values(v_order_id,v_product.id,v_product.slug,v_variant_id,v_product.name,v_product.image_url,case when v_variant_id is null then null else v_variant.size end,case when v_variant_id is null then null else v_variant.color end,v_price,v_qty,v_price*v_qty);
  end loop;
  -- 0020 guard: stored line totals must add up to the priced subtotal.
  if (select coalesce(sum(oi.line_total_paise),0) from public.order_items oi where oi.order_id=v_order_id) <> v_subtotal then
    raise exception 'SKXNZ_PRICE_MISMATCH' using errcode='22023';
  end if;
  insert into public.order_events(order_id,event_type,message,metadata) values(v_order_id,'ORDER_CREATED','Buyer created a draft order.',jsonb_build_object('source','create_order_intent_atomic','buyer_user_id',v_buyer,'line_count',jsonb_array_length(p_items)));
  return query select v_order_id,'DRAFT'::text,false;
end $$;

revoke all on function public.create_order_intent_atomic(jsonb,uuid,text,uuid) from public, anon;
grant execute on function public.create_order_intent_atomic(jsonb,uuid,text,uuid) to authenticated;

-- ===========================================================================
-- From 0016_global_idempotency_hardening.sql: idempotent support + returns
-- ===========================================================================
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
  -- 0020 fix: element alias renamed v -> e; "v" collided with the record variable
  -- below and raised 42702 "column reference v is ambiguous" on every call.
  if exists (
    select 1 from jsonb_array_elements(p_items) j(e)
    where jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e->'order_item_id') <> 'string'
      or jsonb_typeof(e->'quantity') <> 'number'
      or coalesce(e->>'quantity','') !~ '^[1-9][0-9]{0,9}$'
  ) then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); end if;
  if exists (select 1 from jsonb_array_elements(p_items) j(e) group by e->>'order_item_id' having count(*) > 1) then
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
$mig$;
  out text := '';
  b uuid := gen_random_uuid(); b2 uuid := gen_random_uuid(); s uuid := gen_random_uuid(); a uuid := gen_random_uuid();
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; v1a uuid; v1b uuid; v1c uuid; v1x uuid; v3 uuid; addr uuid;
  o uuid; li uuid; rq uuid; tk uuid; n int; n2 int; x text; r record; j jsonb;
  k1 uuid := gen_random_uuid(); k3 uuid := gen_random_uuid(); k4 uuid := gen_random_uuid(); k5 uuid := gen_random_uuid();
begin
  out := 'md5=' || md5(m);
  execute m;
  out := out || ' | APPLIED';

  create function pg_temp.t_as(u uuid) returns void language plpgsql as $f$
  begin
    reset role;
    if u is null then
      perform set_config('request.jwt.claims', '{"role":"anon"}', true);
      set local role anon;
    else
      perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
      set local role authenticated;
    end if;
  end $f$;

  -- Pricing oracle: expected unit = coalesce(variant.price_inr, product.price_inr) * 100 when a
  -- variant is given, else product.price_inr * 100. Compares every stored line + subtotal.
  create function pg_temp.pc(label text, buyer uuid, address uuid, items jsonb) returns text language plpgsql as $f$
  declare k uuid := gen_random_uuid(); r record; o uuid; e jsonb; eu int; q int; exp_sub int := 0; got_sub int; lsum int; lcount int; cnt int; stored text; bad text := '';
  begin
    perform pg_temp.t_as(buyer);
    begin
      select * into r from public.create_order_intent_atomic(items, address, null, k);
    exception when others then
      reset role;
      return label || '=ERROR(' || sqlerrm || ')';
    end;
    reset role;
    o := r.order_id;
    for e in select value from jsonb_array_elements(items) loop
      q := (e->>'quantity')::int;
      if nullif(e->>'variant_id', '') is not null then
        select coalesce(v.price_inr, p.price_inr) * 100 into eu from public.product_variants v join public.products p on p.id = v.product_id where v.id = (e->>'variant_id')::uuid;
      else
        select price_inr * 100 into eu from public.products where id = (e->>'product_id')::uuid;
      end if;
      exp_sub := exp_sub + eu * q;
      select count(*) into cnt from public.order_items
       where order_id = o and product_id = (e->>'product_id')::uuid
         and variant_id is not distinct from nullif(e->>'variant_id', '')::uuid
         and unit_price_paise = eu and quantity = q and line_total_paise = eu * q;
      if cnt <> 1 then
        select string_agg(unit_price_paise::text, '/') into stored from public.order_items
         where order_id = o and product_id = (e->>'product_id')::uuid and variant_id is not distinct from nullif(e->>'variant_id', '')::uuid;
        bad := bad || ' [line ' || coalesce(e->>'tag', '?') || ' expected ' || eu || ' stored ' || coalesce(stored, 'none') || ']';
      end if;
    end loop;
    select subtotal_amount_paise into got_sub from public.orders where id = o;
    select coalesce(sum(line_total_paise), 0), count(*) into lsum, lcount from public.order_items where order_id = o;
    return label || '=' || case when bad = '' and got_sub = exp_sub and lsum = exp_sub and lcount = jsonb_array_length(items) then 'PASS' else 'FAIL' end
      || '(expected ' || exp_sub || ', subtotal ' || got_sub || ', line sum ' || lsum || bad || ')';
  end $f$;

  create function pg_temp.err(buyer uuid, address uuid, items jsonb) returns text language plpgsql as $f$
  begin
    perform pg_temp.t_as(buyer);
    begin
      perform public.create_order_intent_atomic(items, address, null, gen_random_uuid());
      reset role;
      return 'UNEXPECTED_OK';
    exception when others then
      reset role;
      return sqlerrm;
    end;
  end $f$;

  -- synthetic actors and catalogue (all rolled back)
  insert into auth.users (id, email, aud, role, instance_id) values
    (b,  'zz0020-buyer@test.invalid',  'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
    (b2, 'zz0020-buyer2@test.invalid', 'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
    (s,  'zz0020-seller@test.invalid', 'authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
    (a,  'zz0020-admin@test.invalid',  'authenticated','authenticated','00000000-0000-0000-0000-000000000000');
  update public.users set role = 'SELLER' where id = s;
  update public.users set role = 'ADMIN' where id = a;
  insert into public.products (seller_id, slug, name, status, price_inr) values (s, 'zz0020-p1', 'ZZ P1 optioned', 'ACTIVE', 1000) returning id into p1;
  insert into public.products (seller_id, slug, name, status, price_inr) values (s, 'zz0020-p2', 'ZZ P2 plain', 'ACTIVE', 500) returning id into p2;
  insert into public.products (seller_id, slug, name, status, price_inr) values (s, 'zz0020-p3', 'ZZ P3 optioned', 'ACTIVE', 1800) returning id into p3;
  insert into public.products (seller_id, slug, name, status, price_inr) values (s, 'zz0020-p4', 'ZZ P4 plain', 'ACTIVE', 800) returning id into p4;
  insert into public.products (seller_id, slug, name, status, price_inr) values (s, 'zz0020-p5', 'ZZ P5 archived', 'ARCHIVED', 900) returning id into p5;
  insert into public.product_variants (product_id, size, color, price_inr, stock_quantity) values (p1, 'M', 'Black', 1200, 5) returning id into v1a;
  insert into public.product_variants (product_id, size, color, price_inr, stock_quantity) values (p1, 'L', 'Black', 1500, 5) returning id into v1b;
  insert into public.product_variants (product_id, size, color, price_inr, stock_quantity) values (p1, 'S', 'Black', null, 5) returning id into v1c;
  insert into public.product_variants (product_id, size, color, price_inr, stock_quantity, is_active) values (p1, 'XL', 'Black', 1300, 5, false) returning id into v1x;
  insert into public.product_variants (product_id, size, color, price_inr, stock_quantity) values (p3, 'M', 'White', 2000, 5) returning id into v3;
  insert into public.addresses (user_id, full_name, line1, city) values (b, 'ZZ Test', '1 Test Street', 'Mumbai') returning id into addr;

  -- A. pricing matrix
  out := out || ' | PRICING ' || pg_temp.pc('opt>plain', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1), jsonb_build_object('tag','P2','product_id',p2,'quantity',1)));
  out := out || ' ' || pg_temp.pc('plain>opt', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P2','product_id',p2,'quantity',1), jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1)));
  out := out || ' ' || pg_temp.pc('opt>opt(diff products)', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1), jsonb_build_object('tag','P3/M','product_id',p3,'variant_id',v3,'quantity',1)));
  out := out || ' ' || pg_temp.pc('opt>opt(same product)', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1), jsonb_build_object('tag','P1/L','product_id',p1,'variant_id',v1b,'quantity',1)));
  out := out || ' ' || pg_temp.pc('plain>plain', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P2','product_id',p2,'quantity',1), jsonb_build_object('tag','P4','product_id',p4,'quantity',1)));
  out := out || ' ' || pg_temp.pc('qty>1', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/L','product_id',p1,'variant_id',v1b,'quantity',3), jsonb_build_object('tag','P4','product_id',p4,'quantity',2)));
  out := out || ' ' || pg_temp.pc('3-line', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1), jsonb_build_object('tag','P2','product_id',p2,'quantity',1), jsonb_build_object('tag','P3/M','product_id',p3,'variant_id',v3,'quantity',1)));
  out := out || ' ' || pg_temp.pc('3-line reversed', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P3/M','product_id',p3,'variant_id',v3,'quantity',1), jsonb_build_object('tag','P2','product_id',p2,'quantity',1), jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1)));
  out := out || ' ' || pg_temp.pc('opt>plain>opt', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/L','product_id',p1,'variant_id',v1b,'quantity',1), jsonb_build_object('tag','P4','product_id',p4,'quantity',1), jsonb_build_object('tag','P1/M','product_id',p1,'variant_id',v1a,'quantity',1)));
  out := out || ' ' || pg_temp.pc('null-price option', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P1/S','product_id',p1,'variant_id',v1c,'quantity',1), jsonb_build_object('tag','P2','product_id',p2,'quantity',1)));
  out := out || ' ' || pg_temp.pc('by slug', b, addr, jsonb_build_array(
      jsonb_build_object('tag','P4','product_slug','zz0020-p4','product_id',p4,'quantity',1)));

  -- B. rejected carts
  out := out || ' | REJECT unknown_variant=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',gen_random_uuid(),'quantity',1)));
  out := out || ' foreign_variant=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v3,'quantity',1)));
  out := out || ' inactive_variant=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v1x,'quantity',1)));
  out := out || ' missing_variant=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p1,'quantity',1)));
  out := out || ' out_of_stock=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v1a,'quantity',6)));
  out := out || ' archived_product=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p5,'quantity',1)));
  out := out || ' qty11=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p2,'quantity',11)));
  out := out || ' qty0=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id',p2,'quantity',0)));
  out := out || ' bad_uuid=' || pg_temp.err(b, addr, jsonb_build_array(jsonb_build_object('product_id','not-a-uuid','quantity',1)));
  out := out || ' other_buyer_address=' || pg_temp.err(b2, addr, jsonb_build_array(jsonb_build_object('product_id',p2,'quantity',1)));
  out := out || ' seller_buying=' || pg_temp.err(s, addr, jsonb_build_array(jsonb_build_object('product_id',p2,'quantity',1)));

  -- C. idempotency
  perform pg_temp.t_as(b);
  select * into r from public.create_order_intent_atomic(jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v1a,'quantity',2)), addr, 'test', k1);
  o := r.order_id; out := out || ' | IDEMPOTENCY first reused=' || r.reused;
  select * into r from public.create_order_intent_atomic(jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v1a,'quantity',2)), addr, 'test', k1);
  out := out || ' replay reused=' || r.reused || ' same_order=' || (r.order_id = o);
  begin
    perform public.create_order_intent_atomic(jsonb_build_array(jsonb_build_object('product_id',p1,'variant_id',v1a,'quantity',3)), addr, 'test', k1);
    out := out || ' changed_payload=UNEXPECTED_OK';
  exception when others then out := out || ' changed_payload=' || sqlerrm; end;
  reset role;
  select count(*) into n from public.order_items where order_id = o;
  select count(*) into n2 from public.orders where buyer_id = b and idempotency_key = k1;
  out := out || ' lines=' || n || ' orders_for_key=' || n2;
  perform pg_temp.t_as(b2); select count(*) into n from public.orders; out := out || ' other_buyer_sees_orders=' || n;
  reset role;

  -- D. seller fulfilment (order marked PAID by superuser, standing in for the payment webhook)
  update public.orders set status = 'PAID' where id = o;
  select id into li from public.order_items where order_id = o;
  perform pg_temp.t_as(s);
  select * into r from public.seller_update_line_fulfilment(li, 'ADVANCE', 'ACCEPTED'); out := out || ' | SELLER advance=' || r.seller_fulfilment_status;
  begin perform public.seller_update_line_fulfilment(li, 'ADVANCE', 'HANDED_TO_DELIVERY'); out := out || ' skip_step=UNEXPECTED_OK';
  exception when others then out := out || ' skip_step=' || sqlerrm; end;
  select count(*) into n from public.order_item_events; out := out || ' seller_sees_events=' || n;
  perform pg_temp.t_as(b);
  begin perform public.seller_update_line_fulfilment(li, 'ADVANCE', 'PACKED'); out := out || ' buyer_as_seller=UNEXPECTED_OK';
  exception when others then out := out || ' buyer_as_seller=' || sqlerrm; end;
  select count(*) into n from public.order_item_events; out := out || ' buyer_sees_events=' || n;
  perform pg_temp.t_as(b2); select count(*) into n from public.order_item_events; out := out || ' other_buyer_sees_events=' || n;
  begin insert into public.order_item_events (order_item_id, event_type, message) values (li, 'X', 'forged'); out := out || ' forge_event=UNEXPECTED_OK';
  exception when others then out := out || ' forge_event=' || sqlstate; end;

  -- E. admin order transitions
  perform pg_temp.t_as(b);
  begin perform public.admin_update_order_status_atomic(o, 'FULFILLING'); out := out || ' | buyer_as_admin=UNEXPECTED_OK';
  exception when others then out := out || ' | buyer_as_admin=' || sqlerrm; end;
  perform pg_temp.t_as(a);
  select * into r from public.admin_update_order_status_atomic(o, 'FULFILLING'); x := r.status;
  select * into r from public.admin_update_order_status_atomic(o, 'SHIPPED'); x := x || '>' || r.status;
  select * into r from public.admin_update_order_status_atomic(o, 'DELIVERED'); x := x || '>' || r.status;
  out := out || ' ADMIN ' || x;
  begin perform public.admin_update_order_status_atomic(o, 'PAID'); out := out || ' backwards=UNEXPECTED_OK';
  exception when others then out := out || ' backwards=' || sqlerrm; end;

  -- F. returns (the path that failed with 42702)
  perform pg_temp.t_as(b);
  j := public.create_return_request_idempotent(o, 'Wrong size', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 1)), k3);
  rq := (j->>'return_request_id')::uuid; out := out || ' | RETURN ok=' || (j->>'ok') || ' ' || coalesce(j->>'status', j->>'code');
  j := public.create_return_request_idempotent(o, 'Wrong size', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 1)), k3);
  out := out || ' replay reused=' || coalesce(j->>'reused', j->>'code') || ' same=' || ((j->>'return_request_id')::uuid = rq);
  j := public.create_return_request_idempotent(o, 'Different', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 1)), k3);
  out := out || ' changed_payload=' || coalesce(j->>'code', 'ok');
  j := public.create_return_request_idempotent(o, 'Again', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 2)), gen_random_uuid());
  out := out || ' over_quantity=' || coalesce(j->>'code', 'ok');
  j := public.create_return_request_idempotent(o, 'Dup', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 1), jsonb_build_object('order_item_id', li, 'quantity', 1)), gen_random_uuid());
  out := out || ' duplicate_item=' || coalesce(j->>'code', 'ok');
  begin insert into public.return_requests (order_id, buyer_id, status, reason) values (o, b, 'REQUESTED', 'direct'); out := out || ' direct_insert=UNEXPECTED_OK';
  exception when others then out := out || ' direct_insert=' || sqlstate; end;
  begin insert into public.return_request_items (return_request_id, order_item_id, quantity) values (rq, li, 1); out := out || ' direct_item_insert=UNEXPECTED_OK';
  exception when others then out := out || ' direct_item_insert=' || sqlstate; end;
  select count(*) into n from public.return_requests; out := out || ' buyer_sees_returns=' || n;
  perform pg_temp.t_as(b2);
  j := public.create_return_request_idempotent(o, 'Steal', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'quantity', 1)), gen_random_uuid());
  out := out || ' other_buyer=' || coalesce(j->>'code', 'ok');
  perform pg_temp.t_as(s);
  select count(*) into n from public.seller_active_return_indicators(array[li]); out := out || ' seller_indicators=' || n;
  perform pg_temp.t_as(b2);
  select count(*) into n from public.seller_active_return_indicators(array[li]); out := out || ' non_seller_indicators=' || n;
  perform pg_temp.t_as(a);
  select * into r from public.admin_update_return_status_atomic(rq, 'IN_REVIEW'); out := out || ' admin_return=' || r.status;
  begin perform public.admin_update_return_status_atomic(rq, 'REQUESTED'); out := out || ' return_backwards=UNEXPECTED_OK';
  exception when others then out := out || ' return_backwards=' || sqlerrm; end;

  -- G. support
  perform pg_temp.t_as(b);
  j := public.create_support_ticket_idempotent('ORDER', 'Where is my order', 'Hello', o, k4);
  tk := (j->>'ticket_id')::uuid; out := out || ' | TICKET ok=' || (j->>'ok') || ' ' || coalesce(j->>'status', j->>'code');
  j := public.create_support_ticket_idempotent('ORDER', 'Where is my order', 'Hello', o, k4); out := out || ' replay reused=' || coalesce(j->>'reused', j->>'code');
  j := public.create_support_ticket_idempotent('ORDER', 'Changed', 'Hello', o, k4); out := out || ' changed_payload=' || coalesce(j->>'code', 'ok');
  j := public.add_support_ticket_message_idempotent(tk, 'Any update?', 'BUYER', k5); out := out || ' message ok=' || (j->>'ok');
  j := public.add_support_ticket_message_idempotent(tk, 'Any update?', 'BUYER', k5); out := out || ' message_replay reused=' || coalesce(j->>'reused', j->>'code');
  j := public.add_support_ticket_message_idempotent(tk, 'pretend admin', 'ADMIN', gen_random_uuid()); out := out || ' spoof_role=' || coalesce(j->>'code', 'ok');
  select count(*) into n from public.support_ticket_messages where ticket_id = tk; out := out || ' buyer_sees_messages=' || n;
  perform pg_temp.t_as(b2);
  j := public.add_support_ticket_message_idempotent(tk, 'intrude', 'BUYER', gen_random_uuid()); out := out || ' other_buyer=' || coalesce(j->>'code', 'ok');
  j := public.create_support_ticket_idempotent('ORDER', 'Not mine', 'x', o, gen_random_uuid()); out := out || ' other_buyer_order=' || coalesce(j->>'code', 'ok');

  -- H. saved items
  perform pg_temp.t_as(b);
  insert into public.saved_items (user_id, product_slug, product_title) values (b, 'zz0020-p1', 'ZZ P1 optioned');
  begin insert into public.saved_items (user_id, product_slug, product_title) values (b, 'zz0020-p1', 'ZZ P1 optioned'); out := out || ' | SAVED duplicate=UNEXPECTED_OK';
  exception when others then out := out || ' | SAVED duplicate=' || sqlstate; end;
  begin insert into public.saved_items (user_id, product_slug, product_title) values (b2, 'zz0020-p1', 'x'); out := out || ' forge_owner=UNEXPECTED_OK';
  exception when others then out := out || ' forge_owner=' || sqlstate; end;
  begin update public.saved_items set product_title = 'edited' where user_id = b; out := out || ' update=UNEXPECTED_OK';
  exception when others then out := out || ' update=' || sqlstate; end;
  select count(*) into n from public.saved_items; out := out || ' own=' || n;
  perform pg_temp.t_as(b2); select count(*) into n from public.saved_items; out := out || ' other_buyer=' || n;
  perform pg_temp.t_as(a); select count(*) into n from public.saved_items; out := out || ' admin=' || n;
  perform pg_temp.t_as(null);
  begin select count(*) into n from public.saved_items; out := out || ' anon=READABLE';
  exception when others then out := out || ' anon=' || sqlstate; end;
  begin perform public.create_support_ticket_idempotent('ORDER', 's', 'm', null, gen_random_uuid()); out := out || ' anon_rpc=UNEXPECTED_OK';
  exception when others then out := out || ' anon_rpc=' || sqlstate; end;
  reset role;

  -- I. privileges, RLS, grants
  select string_agg(p.proname || ':anon=' || has_function_privilege('anon', p.oid, 'execute') || ',auth=' || has_function_privilege('authenticated', p.oid, 'execute'), ' ' order by p.proname) into x
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('seller_update_line_fulfilment','seller_active_return_indicators','admin_update_order_status_atomic','admin_update_return_status_atomic','create_order_intent_atomic','create_support_ticket_idempotent','add_support_ticket_message_idempotent','create_return_request_idempotent');
  out := out || ' | PRIVILEGES ' || x;
  select string_agg(relname || '=' || relrowsecurity, ',') into x from pg_class where oid in ('public.saved_items'::regclass, 'public.order_item_events'::regclass); out := out || ' | RLS ' || x;
  select string_agg(t || ':' || g, ' ') into x from (select table_name t, grantee || '=' || string_agg(privilege_type, '+' order by privilege_type) g from information_schema.role_table_grants where table_schema = 'public' and table_name in ('saved_items','order_item_events','return_requests','return_request_items') and grantee in ('anon','authenticated') group by table_name, grantee) z;
  out := out || ' | GRANTS ' || coalesce(x, 'none');

  raise exception 'RESULT: %', out;
end $t$;
