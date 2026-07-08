-- =============================================================
-- SKXNZ — D5-1: Buyer saved items (wishlist / save-for-later)
-- Table: public.saved_items
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
--
-- DRAFT — NOT YET APPLIED. Safe to re-run (idempotent).
--
-- Purpose: let a signed-in buyer save LIVE Supabase catalog products with a
-- self-contained snapshot so the saved item still renders cleanly even if the
-- product's live display data changes later. Buyers own their own rows only.
--
-- Depends on: 0001_user_layer.sql (public.users, set_updated_at) and
--             0003_fix_admin_rls_helper.sql (public.is_admin()).
-- =============================================================


-- =============================================================
-- 1. TABLE: public.saved_items
--    One row per (buyer, saved product/variant/size). product_id is
--    NULLABLE on purpose: the snapshot columns are the source of truth
--    for rendering, so a saved item survives even if the product row is
--    later removed. price_inr is WHOLE RUPEES to match public.products
--    (a display-price snapshot), never floats.
-- =============================================================

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
