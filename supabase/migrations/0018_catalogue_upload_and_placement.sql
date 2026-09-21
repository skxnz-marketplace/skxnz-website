-- =============================================================
-- SKXNZ — Slice 18: Real catalogue photo upload + homepage placement
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Do NOT run via CLI or ORM. Do NOT modify .env.local.
--
-- Founder-confirmed v1 scope:
--   - Both sellers (their own products) and admin (any product) can upload
--     real photos — no storage bucket existed at all before this.
--   - Multi-image gallery per product (product_images already supports
--     this shape; it just had no upload path).
--   - Admin gets Featured/Limited toggles (is_featured/is_limited already
--     existed on products but were never exposed in any UI) plus manual
--     Trending Now ordering, to directly fix the wrong-photo/wrong-product
--     mismatch PROGRESS.md flagged in the auto-imported seed data.
--
-- Depends on: 0002_catalog_layer.sql (public.products, public.product_images),
--             0003_fix_admin_rls_helper.sql (public.is_admin()).
-- =============================================================


-- =============================================================
-- 1. STORAGE BUCKET: product-images
--    Public read (product photos are meant to be publicly visible — same
--    trust level as the URLs already stored in product_images.url today).
--    Object path convention: {seller_id}/{product_id}/{filename}. Admin
--    uploads on behalf of a seller still write under that seller's id so
--    ownership stays consistent; a product with no seller (legacy/seed
--    data) uses the literal folder "admin".
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =============================================================
-- 2. STORAGE RLS
--    storage.objects already has RLS enabled by default in every Supabase
--    project — these are the policies for this bucket specifically.
-- =============================================================

drop policy if exists "product-images: public can read" on storage.objects;
create policy "product-images: public can read"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

-- A seller may upload only into their own folder (first path segment =
-- their own auth.uid()), or admin may upload into any folder.
drop policy if exists "product-images: owner or admin can insert" on storage.objects;
create policy "product-images: owner or admin can insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select public.is_admin())
    )
  );

drop policy if exists "product-images: owner or admin can update" on storage.objects;
create policy "product-images: owner or admin can update"
  on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select public.is_admin())
    )
  );

drop policy if exists "product-images: owner or admin can delete" on storage.objects;
create policy "product-images: owner or admin can delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select public.is_admin())
    )
  );


-- =============================================================
-- 3. product_images.storage_path
--    Lets a delete action remove the underlying storage object too, not
--    just the row. Nullable — existing/legacy rows (pasted image_url,
--    seed data) have no storage object to clean up.
-- =============================================================

alter table public.product_images
  add column if not exists storage_path text;

comment on column public.product_images.storage_path is
  'storage.objects path under the product-images bucket, e.g. "{seller_id}/{product_id}/{filename}". Null for legacy rows created from a pasted URL (no owned storage object to delete alongside the row).';


-- =============================================================
-- 4. products.trending_sort_order
--    Null = not manually placed in homepage Trending Now (existing
--    newest-first behaviour). Non-null = shows in Trending Now, ordered
--    ascending. Admin-only write, enforced by the existing admin-only
--    UPDATE policy on public.products (0002/0013) — no new RLS needed.
-- =============================================================

alter table public.products
  add column if not exists trending_sort_order integer;

comment on column public.products.trending_sort_order is
  'Null = not manually curated into homepage Trending Now. Non-null = shown there, ordered ascending. Admin-only in practice — see the products_enforce_admin_only_placement trigger below (section 5), not the table-level RLS policy (which is row-level and would otherwise let a seller set this on their own product).';

create index if not exists products_trending_sort_order_idx
  on public.products (trending_sort_order)
  where trending_sort_order is not null;


-- =============================================================
-- 5. GUARD: placement columns are admin-only in practice, not just in the UI
--    "products: seller can update own draft or pending" (0004) is a ROW-level
--    policy — it does not restrict which COLUMNS a seller can touch on their
--    own row. The app's seller UI never exposes is_featured/is_limited/
--    trending_sort_order, but nothing stopped a seller from setting them
--    directly via a raw REST call. (is_featured/is_limited existed before
--    this migration with this exact exposure; trending_sort_order would
--    have inherited it. Same lesson as community_poster_grants needing its
--    own table instead of a column on an owner-writable table — here a
--    trigger is more surgical since these three columns live alongside
--    many seller-legitimate ones on the same row.)
--    Fix: a trigger silently reverts these three columns to their previous
--    (or, on insert, default/false/null) value whenever the actor isn't
--    admin — the rest of the write still goes through. Matches the
--    "force pending on insert" pattern already used for community_posts.
-- =============================================================

create or replace function public.products_enforce_admin_only_placement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.trending_sort_order = old.trending_sort_order;
      new.is_featured = old.is_featured;
      new.is_limited = old.is_limited;
    else
      new.trending_sort_order = null;
      new.is_featured = false;
      new.is_limited = false;
    end if;
  end if;
  return new;
end;
$$;

comment on function public.products_enforce_admin_only_placement() is
  'trending_sort_order/is_featured/is_limited are admin-only curation, not seller-writable — reverted server-side for any non-admin insert/update regardless of what the client sends.';

drop trigger if exists products_enforce_admin_only_placement_trigger on public.products;
create trigger products_enforce_admin_only_placement_trigger
  before insert or update on public.products
  for each row execute function public.products_enforce_admin_only_placement();
