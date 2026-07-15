# D6-A Catalog Recovery and QA Readiness

## Outcome

D6-A started from `launch-war-july30` at `a98811b` in the isolated
`codex/d6a-catalog-recovery` worktree. The canonical catalog migration
`0002_catalog_layer.sql` was not authoritatively recovered. No migration,
verification script, schema, RLS policy, RPC, or application boundary was
invented or changed.

The expanded local Git audit found only historical descriptions and a dirty
checkpoint worktree containing untracked copies. Neither is a source commit or
canonical artifact. The Critical blocker therefore remains in force.

## Migration-chain review

The numeric chain has no duplicate number: `0001`, then a missing `0002`, and
`0003` through `0011`. The downstream static contract was reviewed: catalog
tables and `product_status` are required by seller lifecycle, commerce,
seller-fulfilment, and atomic order-intent work. The existing draft `0008`
returns, `0009` seller action, `0010` admin actions, and `0011` buyer order
intent migrations have explicit authenticated function grants and declared
function search paths in their source. They remain draft and unapplied.

## QA readiness

The Day 6 disposable-QA pack supplies an ordered apply/verify/isolation path,
operator inputs, schema-only recovery procedure, verification matrix,
concurrency matrix, and browser checklist. It stops before a blank-project
apply until an authorized operator recovers an exact 0002 artifact with
provenance and checksum.

Application boundary review found `createOrderIntent` calls only
`create_order_intent_atomic`; a missing RPC maps to truthful `NOT_WIRED`, and
checkout does not report a completed or paid order in that state. The review
found no client-reachable service-role import, payment-success transition,
refund completion claim, or delivery-provider claim requiring a code change.

## Operator actions still required

1. Obtain an authorized schema-only export and source-control/backup recovery
   for the exact historical 0002 migration and matching verification artifact.
2. Record provenance and checksum outside source control; separately review
   restored content against the Day 6 dependency inventory.
3. Apply the recovered sequence only in a fresh disposable Supabase project,
   then run verification, isolation, multi-role, and concurrency checks.
4. Repeat authenticated browser QA with non-production public configuration.

Mocked application tests do not prove live PostgreSQL RLS, grant behavior,
locks, or concurrency. No push, launch merge, deployment, live SQL, secret
inspection, or environment-file change occurred.
