# Metadata, sitemap, robots, and manifest audit

- Root metadata uses `SKXNZ | WEAR THE SIGNAL`, private-preview copy, canonical root URL, Open Graph, and Twitter summary metadata.
- `app/sitemap.ts` lists public static discovery/information routes only; it excludes account, order, seller, admin, checkout, and API paths.
- `app/robots.ts` disallows protected and operational paths and points to `/sitemap.xml`.
- `app/manifest.ts` supplies SKXNZ identity, local icon, theme, and truthful private-preview copy.
- No metadata claims payment-live, refund-live, delivery-live, or launch-ready status.

Dynamic catalog URLs are deliberately not emitted while canonical 0002 remains unrecovered.
