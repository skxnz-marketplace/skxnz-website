-- =============================================================
-- SKXNZ — Slice 5: Internal commerce layer (DRAFT — NOT APPLIED YET)
-- Tables: orders, order_items, order_events,
--         support_tickets, support_ticket_messages,
--         return_requests, return_request_items
--
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
--
-- Money rule: ALL amounts are integer paise (1 rupee = 100 paise).
-- Never floats. Never rupees in amount columns.
--
-- Status rule: an order becomes PAID only from a signature-verified
-- Razorpay webhook (server-side). Client code must never set PAID,
-- REFUNDED, or any post-payment status.
--
-- Depends on: 0001_user_layer.sql (public.users, public.set_updated_at),
--             0003_fix_admin_rls_helper.sql (public.is_admin),
--             0002_catalog_layer (public.products / product_variants,
--             applied in the live project; file not in this repo).
-- =============================================================


-- =============================================================
-- 1. TABLE: public.orders
--    One row per buyer order. buyer_id has NO cascade delete:
--    order rows are financial records and must survive attempts
--    to delete a user (delete the user's auth row will fail while
--    orders exist — intentional for V1; revisit with an anonymize
--    strategy later).
-- =============================================================

create table public.orders (
  id                          uuid        primary key default gen_random_uuid(),
  buyer_id                    uuid        not null references public.users(id),
  status                      text        not null default 'DRAFT'
    constraint orders_status_check check (status in (
      'DRAFT', 'PAYMENT_PENDING', 'PAID', 'FULFILLING',
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
    )),
  currency                    text        not null default 'INR'
    constraint orders_currency_check check (currency = 'INR'),
  subtotal_amount_paise       integer     not null
    constraint orders_subtotal_nonnegative check (subtotal_amount_paise >= 0),
  shipping_amount_paise       integer
    constraint orders_shipping_nonnegative check (shipping_amount_paise is null or shipping_amount_paise >= 0),
  tax_amount_paise            integer
    constraint orders_tax_nonnegative check (tax_amount_paise is null or tax_amount_paise >= 0),
  total_amount_paise          integer
    constraint orders_total_nonnegative check (total_amount_paise is null or total_amount_paise >= 0),
  contact_snapshot            jsonb       not null,
  shipping_address_snapshot   jsonb       not null,
  delivery_note               text,
  payment_provider            text,
  payment_reference           text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.orders is
  'Buyer orders. Amounts are integer paise. PAID status may only be set server-side after a signature-verified payment webhook.';

create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();


-- =============================================================
-- 2. TABLE: public.order_items
--    Immutable line snapshots. product_id/variant_id reference the
--    live catalog but are nullable + not FK-cascaded so an order
--    keeps its history even if a product is later removed.
-- =============================================================

create table public.order_items (
  id                 uuid        primary key default gen_random_uuid(),
  order_id           uuid        not null references public.orders(id) on delete cascade,
  product_id         uuid,
  product_slug       text        not null,
  variant_id         uuid,
  title_snapshot     text        not null,
  brand_snapshot     text,
  image_snapshot     text,
  selected_size      text,
  selected_color     text,
  unit_price_paise   integer     not null
    constraint order_items_unit_price_nonnegative check (unit_price_paise >= 0),
  quantity           integer     not null
    constraint order_items_quantity_positive check (quantity > 0),
  line_total_paise   integer     not null
    constraint order_items_line_total_nonnegative check (line_total_paise >= 0),
  created_at         timestamptz not null default now()
);

comment on table public.order_items is
  'Per-order line snapshots in integer paise. Snapshots survive catalog changes.';

create index order_items_order_id_idx on public.order_items (order_id);


-- =============================================================
-- 3. TABLE: public.order_events
--    Append-only order timeline (status changes, payment webhook
--    outcomes, fulfillment notes). Written server-side.
-- =============================================================

create table public.order_events (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  event_type  text        not null,
  message     text        not null,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.order_events is
  'Append-only order timeline. Inserted by server-side/service logic only.';

create index order_events_order_id_idx on public.order_events (order_id, created_at);


-- =============================================================
-- 4. TABLE: public.support_tickets
-- =============================================================

create table public.support_tickets (
  id          uuid        primary key default gen_random_uuid(),
  buyer_id    uuid        not null references public.users(id),
  order_id    uuid        references public.orders(id),
  category    text        not null
    constraint support_tickets_category_check check (category in (
      'ORDER', 'RETURN', 'PAYMENT', 'DELIVERY', 'PRODUCT', 'ACCOUNT', 'OTHER'
    )),
  status      text        not null default 'OPEN'
    constraint support_tickets_status_check check (status in (
      'OPEN', 'WAITING_FOR_CUSTOMER', 'IN_REVIEW', 'RESOLVED', 'CLOSED'
    )),
  subject     text        not null
    constraint support_tickets_subject_not_blank check (length(trim(subject)) > 0),
  priority    text        not null default 'NORMAL'
    constraint support_tickets_priority_check check (priority in (
      'LOW', 'NORMAL', 'HIGH', 'URGENT'
    )),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index support_tickets_buyer_id_idx on public.support_tickets (buyer_id);
create index support_tickets_order_id_idx on public.support_tickets (order_id);

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();


-- =============================================================
-- 5. TABLE: public.support_ticket_messages
-- =============================================================

create table public.support_ticket_messages (
  id           uuid        primary key default gen_random_uuid(),
  ticket_id    uuid        not null references public.support_tickets(id) on delete cascade,
  sender_id    uuid        references public.users(id),
  sender_role  text        not null
    constraint support_ticket_messages_sender_role_check check (sender_role in (
      'BUYER', 'SUPPORT', 'ADMIN', 'SYSTEM'
    )),
  message      text        not null
    constraint support_ticket_messages_message_not_blank check (length(trim(message)) > 0),
  metadata     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index support_ticket_messages_ticket_id_idx
  on public.support_ticket_messages (ticket_id, created_at);


-- =============================================================
-- 6. TABLE: public.return_requests
--    REFUNDED status may only be set server-side after a real
--    refund is confirmed by the payment provider — never by client.
-- =============================================================

create table public.return_requests (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id),
  buyer_id    uuid        not null references public.users(id),
  status      text        not null default 'REQUESTED'
    constraint return_requests_status_check check (status in (
      'REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_PENDING',
      'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CLOSED'
    )),
  reason      text        not null
    constraint return_requests_reason_not_blank check (length(trim(reason)) > 0),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index return_requests_order_id_idx on public.return_requests (order_id);
create index return_requests_buyer_id_idx on public.return_requests (buyer_id);

create trigger return_requests_set_updated_at
  before update on public.return_requests
  for each row execute function public.set_updated_at();


-- =============================================================
-- 7. TABLE: public.return_request_items
-- =============================================================

create table public.return_request_items (
  id                 uuid        primary key default gen_random_uuid(),
  return_request_id  uuid        not null references public.return_requests(id) on delete cascade,
  order_item_id      uuid        not null references public.order_items(id),
  quantity           integer     not null
    constraint return_request_items_quantity_positive check (quantity > 0),
  reason             text,
  created_at         timestamptz not null default now()
);

create index return_request_items_request_id_idx
  on public.return_request_items (return_request_id);


-- =============================================================
-- 8. ROW LEVEL SECURITY
--    Every table: RLS on, no anon/public read, buyers see only
--    their own rows, admin via public.is_admin().
-- =============================================================

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.return_requests enable row level security;
alter table public.return_request_items enable row level security;

-- ---------- orders ----------

create policy "orders: buyer can select own"
  on public.orders
  for select
  using ( auth.uid() = buyer_id );

-- Buyers may create only their own order in a pre-payment state.
-- PAID and beyond can never be inserted directly by a buyer.
create policy "orders: buyer can insert own pre-payment"
  on public.orders
  for insert
  with check (
    auth.uid() = buyer_id
    and status in ('DRAFT', 'PAYMENT_PENDING')
  );

create policy "orders: admin can manage all"
  on public.orders
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- NOTE: no buyer UPDATE policy on purpose. Status transitions
-- (PAYMENT_PENDING -> PAID etc.) happen via server-side service-role
-- logic driven by verified payment webhooks — never from the client.

-- ---------- order_items ----------

create policy "order_items: buyer can select own"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.buyer_id = auth.uid()
    )
  );

create policy "order_items: buyer can insert into own pre-payment order"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.buyer_id = auth.uid()
        and o.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  );

create policy "order_items: admin can manage all"
  on public.order_items
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- order_events ----------

create policy "order_events: buyer can select own"
  on public.order_events
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and o.buyer_id = auth.uid()
    )
  );

-- No buyer insert: the timeline is written by server-side logic only.
create policy "order_events: admin can manage all"
  on public.order_events
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- support_tickets ----------

create policy "support_tickets: buyer can select own"
  on public.support_tickets
  for select
  using ( auth.uid() = buyer_id );

create policy "support_tickets: buyer can insert own"
  on public.support_tickets
  for insert
  with check (
    auth.uid() = buyer_id
    and status = 'OPEN'
  );

create policy "support_tickets: admin can manage all"
  on public.support_tickets
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- support_ticket_messages ----------

create policy "support_ticket_messages: buyer can select own"
  on public.support_ticket_messages
  for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.buyer_id = auth.uid()
    )
  );

create policy "support_ticket_messages: buyer can insert own as buyer"
  on public.support_ticket_messages
  for insert
  with check (
    sender_role = 'BUYER'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.buyer_id = auth.uid()
    )
  );

create policy "support_ticket_messages: admin can manage all"
  on public.support_ticket_messages
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- return_requests ----------

create policy "return_requests: buyer can select own"
  on public.return_requests
  for select
  using ( auth.uid() = buyer_id );

create policy "return_requests: buyer can insert own requested"
  on public.return_requests
  for insert
  with check (
    auth.uid() = buyer_id
    and status = 'REQUESTED'
    and exists (
      select 1 from public.orders o
      where o.id = return_requests.order_id
        and o.buyer_id = auth.uid()
    )
  );

create policy "return_requests: admin can manage all"
  on public.return_requests
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- return_request_items ----------

create policy "return_request_items: buyer can select own"
  on public.return_request_items
  for select
  using (
    exists (
      select 1 from public.return_requests r
      where r.id = return_request_items.return_request_id
        and r.buyer_id = auth.uid()
    )
  );

create policy "return_request_items: buyer can insert own"
  on public.return_request_items
  for insert
  with check (
    exists (
      select 1 from public.return_requests r
      where r.id = return_request_items.return_request_id
        and r.buyer_id = auth.uid()
        and r.status = 'REQUESTED'
    )
  );

create policy "return_request_items: admin can manage all"
  on public.return_request_items
  for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- =============================================================
-- 9. GRANTS
--    RLS is the row filter; grants are the table-level gate.
--    anon gets NOTHING on commerce tables. authenticated gets only
--    what the policies above can allow through.
-- =============================================================

revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.order_events from anon;
revoke all on public.support_tickets from anon;
revoke all on public.support_ticket_messages from anon;
revoke all on public.return_requests from anon;
revoke all on public.return_request_items from anon;

grant select, insert on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select on public.order_events to authenticated;
grant select, insert on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;
grant select, insert on public.return_requests to authenticated;
grant select, insert on public.return_request_items to authenticated;
