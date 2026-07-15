# Day 6 disposable Supabase QA master runbook

## Scope and safety boundary

Run this only in a newly created disposable Supabase QA project. Do not run any script against production. Migration `0002` is a Critical blocker and must be recovered from an authoritative schema-only source before this apply sequence starts.

## Prerequisites

- An empty disposable project and an operator with SQL Editor access.
- An authoritative catalog baseline artifact with checksum, provenance, and a reviewed `0002` compatibility record.
- Non-production credentials for one BUYER, two approved SELLER users, two ADMIN users, and one unauthenticated session.
- Test product, variants, address, order, return, and support fixtures. Record only IDs and PASS/FAIL evidence; do not place credentials in this repository.

## Apply and verification order

1. Stop if recovered `0002` is absent, its hash is not approved, or catalog preflight does not pass.
2. Apply the approved historical `0002`, then its exact seed/verification artifacts if supplied by the same authoritative source.
3. Apply `0003`, `0004`, `0005`, `0006`, `0007`, `0008`, `0009`, `0010`, and `0011` in numeric order. Do not substitute a reconstructed baseline.
4. Run each matching script in `supabase/verification/`: preflight/verify before isolation where applicable, then `0008`, `0009`, `0010`, and `0011` verification and isolation scripts.
5. Execute the browser checklist after database assertions pass.

## Stop conditions

- Missing `0002`, baseline hash mismatch, or catalog RLS/policy failure.
- Any migration error, unexpected pre-existing object, missing function signature, incorrect grant, or failed isolation assertion.
- Any attempt to use production credentials, service-role credentials in a browser, or an unreviewed manual repair.

## Required evidence

For every step retain timestamp, disposable project identifier, migration hash, script name, role used, result grid/export, and operator initials. A passing mocked application test is not proof of live RLS or concurrent PostgreSQL behavior.
