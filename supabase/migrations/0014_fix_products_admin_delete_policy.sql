-- SKXNZ: preserve admin-only product deletion without direct public.users RLS.
-- The verified legacy DELETE policy queried public.users directly under PUBLIC.
-- public.is_admin() already provides the same server-owned ADMIN check and is
-- used by the current admin product INSERT and UPDATE policies.

drop policy if exists "products: admin can delete" on public.products;

create policy "products: admin can delete"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());
