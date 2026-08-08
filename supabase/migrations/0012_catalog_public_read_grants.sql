-- SKXNZ public catalog Data API access.
-- Apply only after 0012_public_catalog_read_diagnostic.sql confirms that the
-- existing public products SELECT policy is limited to ACTIVE/published rows.
-- RLS remains enabled and remains the row-level boundary.

grant select on table public.products to anon, authenticated;
