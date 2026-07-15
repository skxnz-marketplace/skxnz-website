# Day 6 schema-only catalog recovery procedure

1. Obtain written authorization for the known-good source project and confirm it is not the disposable target.
2. Export schema definitions only, using an approved read-only administrative route such as Supabase CLI database dump with schema-only options or a controlled `pg_dump --schema-only`. Do not export user data or credentials into this repository.
3. Hash the export and record source project identifier, timestamp, operator, tool version, and SHA-256 in the external QA evidence store.
4. Compare the export to downstream requirements: enum `product_status`; catalog tables; columns used by `0004` through `0011`; indexes, triggers, RLS, policies, and grants.
5. Recover the original migration from authoritative source control or backup. Do not synthesize it from the export. Preserve migration number `0002` and record the source commit/ref and file hash.
6. In a separate reviewed recovery change, add only the exact artifact and its exact verification script if supplied. Re-run static dependency scan before any disposable apply.

Stop if the export cannot prove provenance, the migration text cannot be recovered exactly, or any required catalog object differs from the downstream contract.
