-- SKXNZ: keep admin product reads private without breaking anonymous ACTIVE reads.
-- Live diagnostic confirmed the old public admin SELECT policy queried
-- public.users. That made every anon product read fail before the narrow ACTIVE
-- policy could return rows. public.is_admin() is SECURITY DEFINER and already
-- exists in the current schema for admin product writes.

drop policy if exists "products: admin can select all" on public.products;

create policy "products: admin can select all"
  on public.products
  for select
  to authenticated
  using (public.is_admin());
