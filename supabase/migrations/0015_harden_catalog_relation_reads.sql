-- SKXNZ catalog relation read hardening.
-- Verified legacy seller SELECT policies were PUBLIC and queried public.users.
-- Their ownership boundary is the parent product relationship already used by
-- seller product reads: product.seller_id = auth.uid(). Restrict these policies
-- to authenticated callers, keep that exact ownership predicate, then enable
-- anonymous Data API access for the separately verified ACTIVE-only policies.

drop policy if exists "product_variants: seller can select own" on public.product_variants;
create policy "product_variants: seller can select own"
  on public.product_variants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.seller_id = auth.uid()
    )
  );

drop policy if exists "product_images: seller can select own" on public.product_images;
create policy "product_images: seller can select own"
  on public.product_images
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.seller_id = auth.uid()
    )
  );

grant select on table public.product_variants to anon;
grant select on table public.product_images to anon;
