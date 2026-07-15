# Day 9 operator next steps

1. Recover canonical `0002_catalog_layer.sql` from an authoritative schema export or historical source; do not fabricate it.
2. In disposable Supabase QA only, apply the reviewed migration chain in order and run existing verification, isolation, and concurrency scripts with distinct roles.
3. Configure approved Vercel public/server-only environment values without exposing secrets; use supported Node LTS and pnpm 10.
4. Run `pnpm run build` on Vercel/Linux and retain the actual successful log. Stop if configuration requires unapproved credentials or changes.
5. Perform role-based browser and mobile smoke from `ROUTE_SMOKE_MATRIX.md`, including `NOT_WIRED` behaviour before draft RPCs are applied.
6. Schedule a dedicated buyer UI recovery sprint before launch approval.

No payment, refund, delivery, launch, or database-ready claim is authorized by D9-A.
