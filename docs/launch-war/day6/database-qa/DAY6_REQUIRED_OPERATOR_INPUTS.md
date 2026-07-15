# Day 6 required operator inputs

- A disposable Supabase project URL and non-production operator access.
- A known-good, schema-only catalog export or source-control backup for the original `0002`, including its SHA-256 checksum and source/provenance.
- Exact matching `0002` verification and seed artifacts if they are to be used.
- Test identities: unauthenticated, BUYER, approved SELLER A/B, ADMIN A/B.
- Disposable fixture identifiers for catalog, variants, address, order, order lines, return request/items, and support ticket.
- A place to store QA evidence outside source control.

Never supply production credentials, service-role keys, Razorpay keys, or `.env` contents to the task transcript or repository.
