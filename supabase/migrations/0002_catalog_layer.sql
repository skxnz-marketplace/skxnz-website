-- =============================================================
-- SKXNZ — Slice 2A: Catalog foundation
-- Tables: brands, categories, products, product_variants, product_images
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
-- =============================================================


-- =============================================================
-- 1. ENUM: product_status
-- =============================================================

create type public.product_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED');


-- =============================================================
-- 2. TABLE: public.brands
-- =============================================================

create table public.brands (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        unique not null,
  name            text        not null,
  logo_url        text,
  hero_image_url  text,
  description     text,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index brands_slug_idx on public.brands (slug);

comment on table public.brands is 'SKXNZ-native seller/label brands shown in the marketplace.';


-- =============================================================
-- 3. TABLE: public.categories
-- =============================================================

create table public.categories (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        unique not null,
  name        text        not null,
  parent_id   uuid        references public.categories(id) on delete set null,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_slug_idx on public.categories (slug);

comment on table public.categories is 'Product category tree; parent_id allows optional nesting.';


-- =============================================================
-- 4. TABLE: public.products
-- =============================================================

create table public.products (
  id                     uuid        primary key default gen_random_uuid(),
  seller_id              uuid        references public.users(id) on delete set null,
  brand_id               uuid        references public.brands(id) on delete set null,
  category_id            uuid        references public.categories(id) on delete set null,
  slug                   text        unique not null,
  name                   text        not null,
  subtitle               text,
  description            text,
  status                 public.product_status not null default 'DRAFT',
  price_inr              integer     not null check (price_inr >= 0),
  compare_at_price_inr   integer     check (compare_at_price_inr is null or compare_at_price_inr >= price_inr),
  currency               text        not null default 'INR',
  image_url              text,
  tags                   text[]      not null default '{}',
  is_featured            boolean     not null default false,
  is_limited             boolean     not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index products_slug_idx on public.products (slug);
create index products_status_idx on public.products (status);
create index products_brand_id_idx on public.products (brand_id);
create index products_category_id_idx on public.products (category_id);
create index products_seller_id_idx on public.products (seller_id);

comment on table public.products is 'Core product listing. price_inr/compare_at_price_inr are integer paise-free rupee ints per MVP; money handling elsewhere in the app uses integer paise — keep consistent when wiring checkout.';


-- =============================================================
-- 5. TABLE: public.product_variants
-- =============================================================

create table public.product_variants (
  id              uuid        primary key default gen_random_uuid(),
  product_id      uuid        not null references public.products(id) on delete cascade,
  sku             text        unique,
  size            text,
  color           text,
  price_inr       integer     check (price_inr is null or price_inr >= 0),
  stock_quantity  integer     not null default 0 check (stock_quantity >= 0),
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

comment on table public.product_variants is 'Size/color/SKU variants with per-variant stock and optional price override.';


-- =============================================================
-- 6. TABLE: public.product_images
-- =============================================================

create table public.product_images (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        not null references public.products(id) on delete cascade,
  url         text        not null,
  alt         text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

comment on table public.product_images is 'Ordered gallery images per product.';


-- =============================================================
-- 7. UPDATED_AT TRIGGERS
--    Reuses public.set_updated_at() from 0001_user_layer.sql.
-- =============================================================

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();


-- =============================================================
-- 8. ROW LEVEL SECURITY
-- =============================================================

alter table public.brands            enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.product_images    enable row level security;


-- ── public.brands policies ───────────────────────────────────

create policy "brands: public can select active"
  on public.brands
  for select
  using (is_active = true);

create policy "brands: admin can select all"
  on public.brands
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "brands: admin can insert"
  on public.brands
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "brands: admin can update"
  on public.brands
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "brands: admin can delete"
  on public.brands
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );


-- ── public.categories policies ───────────────────────────────

create policy "categories: public can select active"
  on public.categories
  for select
  using (is_active = true);

create policy "categories: admin can select all"
  on public.categories
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "categories: admin can insert"
  on public.categories
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "categories: admin can update"
  on public.categories
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "categories: admin can delete"
  on public.categories
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );


-- ── public.products policies ─────────────────────────────────

-- Anyone (including anonymous buyers) can read ACTIVE products.
create policy "products: public can select active"
  on public.products
  for select
  using (status = 'ACTIVE');

-- Sellers can read their own products regardless of status.
create policy "products: seller can select own"
  on public.products
  for select
  using (auth.uid() = seller_id);

-- Admins can read everything.
create policy "products: admin can select all"
  on public.products
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- A seller (or admin) can insert a product they own.
create policy "products: seller can insert own"
  on public.products
  for insert
  with check (
    auth.uid() = seller_id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('SELLER', 'ADMIN')
    )
  );

-- A seller can update their own product; admin can update any.
create policy "products: seller can update own"
  on public.products
  for update
  using (
    auth.uid() = seller_id
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

-- Admin-only delete (sellers should archive via status, not delete).
create policy "products: admin can delete"
  on public.products
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );


-- ── public.product_variants policies ─────────────────────────

-- Public can read variants of ACTIVE products only.
create policy "product_variants: public can select for active products"
  on public.product_variants
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'ACTIVE'
    )
  );

-- Seller can read/manage variants for their own products; admin all.
create policy "product_variants: seller can select own"
  on public.product_variants
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_variants: seller can insert own"
  on public.product_variants
  for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_variants: seller can update own"
  on public.product_variants
  for update
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_variants: seller can delete own"
  on public.product_variants
  for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );


-- ── public.product_images policies ───────────────────────────

create policy "product_images: public can select for active products"
  on public.product_images
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'ACTIVE'
    )
  );

create policy "product_images: seller can select own"
  on public.product_images
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_images: seller can insert own"
  on public.product_images
  for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_images: seller can update own"
  on public.product_images
  for update
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );

create policy "product_images: seller can delete own"
  on public.product_images
  for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.seller_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'ADMIN'
    )
  );
