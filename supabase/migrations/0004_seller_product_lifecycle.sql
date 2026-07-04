-- =============================================================
-- SKXNZ - Seller product lifecycle RLS foundation
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
--
-- Purpose:
-- - Extend public.product_status for seller moderation.
-- - Prevent sellers from self-publishing products.
-- - Keep public buyers limited to ACTIVE products via existing 0002 policies.
-- - Move admin catalog management to public.is_admin().
--
-- Important Postgres enum rule:
-- New enum values cannot be used as enum literals in the same transaction that
-- adds them. Policies below compare status::text to avoid that restriction.
-- =============================================================


-- =============================================================
-- 1. ENUM: public.product_status
--    Additive only. Do not rename, drop, or rewrite existing values.
-- =============================================================

alter type public.product_status add value if not exists 'PENDING_REVIEW';
alter type public.product_status add value if not exists 'REJECTED';


-- =============================================================
-- 2. public.products policies
--    Keep these 0002 policies untouched:
--    - "products: public can select active"
--    - "products: seller can select own"
--    - "products: admin can select all"
--    - "products: admin can delete"
-- =============================================================

drop policy if exists "products: seller can insert own" on public.products;

create policy "products: seller can insert own draft or pending"
  on public.products
  for insert
  to authenticated
  with check (
    auth.uid() = seller_id
    and status::text in ('DRAFT', 'PENDING_REVIEW')
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role::text in ('SELLER', 'ADMIN')
    )
  );

drop policy if exists "products: seller can update own" on public.products;

create policy "products: seller can update own draft or pending"
  on public.products
  for update
  to authenticated
  using (
    auth.uid() = seller_id
    and status::text in ('DRAFT', 'PENDING_REVIEW')
  )
  with check (
    auth.uid() = seller_id
    and status::text in ('DRAFT', 'PENDING_REVIEW')
  );

create policy "products: admin can insert"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "products: admin can update all"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 3. public.product_variants policies
--    Keep these 0002 policies untouched:
--    - "product_variants: public can select for active products"
--    - "product_variants: seller can select own"
-- =============================================================

drop policy if exists "product_variants: seller can insert own" on public.product_variants;
drop policy if exists "product_variants: seller can update own" on public.product_variants;
drop policy if exists "product_variants: seller can delete own" on public.product_variants;

create policy "product_variants: seller can insert own draft or pending"
  on public.product_variants
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_variants: seller can update own draft or pending"
  on public.product_variants
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  )
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_variants: seller can delete own draft or pending"
  on public.product_variants
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_variants: admin can manage all"
  on public.product_variants
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 4. public.product_images policies
--    Keep these 0002 policies untouched:
--    - "product_images: public can select for active products"
--    - "product_images: seller can select own"
-- =============================================================

drop policy if exists "product_images: seller can insert own" on public.product_images;
drop policy if exists "product_images: seller can update own" on public.product_images;
drop policy if exists "product_images: seller can delete own" on public.product_images;

create policy "product_images: seller can insert own draft or pending"
  on public.product_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_images: seller can update own draft or pending"
  on public.product_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  )
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_images: seller can delete own draft or pending"
  on public.product_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.seller_id = auth.uid()
        and p.status::text in ('DRAFT', 'PENDING_REVIEW')
    )
  );

create policy "product_images: admin can manage all"
  on public.product_images
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
