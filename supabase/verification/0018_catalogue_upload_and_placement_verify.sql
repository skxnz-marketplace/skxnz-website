-- =============================================================
-- SKXNZ — verification for 0018_catalogue_upload_and_placement.sql
-- Read-only. Run in the Supabase SQL Editor AFTER applying 0018.
-- Compare each result to its EXPECT comment.
-- =============================================================

-- 1. Bucket exists, public, 5MB limit, image mime types only
--    (EXPECT: 1 row, public = true, file_size_limit = 5242880)
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';

-- 2. Storage policies present (EXPECT: 4 rows)
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'product-images:%'
order by policyname;

-- 3. New columns present (EXPECT: 2 rows)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'products' and column_name = 'trending_sort_order')
    or (table_name = 'product_images' and column_name = 'storage_path')
  );

-- 4. Trending index present (EXPECT: 1 row)
select indexname from pg_indexes
where schemaname = 'public' and tablename = 'products'
  and indexname = 'products_trending_sort_order_idx';

-- 5. Placement guard trigger present on products (EXPECT: 1 row)
select tgname from pg_trigger
where tgrelid = 'public.products'::regclass
  and tgname = 'products_enforce_admin_only_placement_trigger';

-- =============================================================
-- 6. MANUAL RLS ISOLATION (run with two seller sessions + one admin
--    session):
--    a) Seller A uploads a file to storage path "{their-uid}/{product-id}/x.jpg"
--       -> succeeds. Anyone (including signed-out) can read it back via its
--       public URL.
--    b) Seller A tries to upload to "{seller-B-uid}/..." -> RLS denies.
--    c) Seller A updates their own product setting is_featured=true and
--       trending_sort_order=1 directly via a raw REST PATCH (not through
--       the app UI) -> the row updates (other columns change), but
--       is_featured/trending_sort_order come back unchanged — the trigger
--       silently reverted them.
--    d) Admin performs the same PATCH on any product -> is_featured and
--       trending_sort_order DO change, as expected.
-- =============================================================
