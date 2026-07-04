# SKXNZ Seller Product Lifecycle 0004 Apply Checklist

**Status: NOT APPLIED - migration exists in repo only; no live claim until manually applied and verified.**

## Purpose

Prepare a safe manual Supabase SQL Editor apply for `0004_seller_product_lifecycle.sql`.

This checklist is preparation only. It does not mean the migration has been applied to live Supabase.

## Apply Order

1. Review the committed diff for:
   - `supabase/migrations/0004_seller_product_lifecycle.sql`
   - `supabase/verification/0004_seller_product_lifecycle_verify.sql`
2. Open the correct SKXNZ Supabase project.
3. Open Supabase SQL Editor.
4. Paste `supabase/migrations/0004_seller_product_lifecycle.sql`.
5. Run it once only.
6. Paste and run `supabase/verification/0004_seller_product_lifecycle_verify.sql`.
7. Compare every verification result with the expected outputs in the comments.
8. Run the smoke tests below.
9. Only after all checks pass, mark this migration APPLIED in the project notes.

## Smoke Tests

- Anonymous buyer can read only `ACTIVE` products.
- Anonymous buyer cannot read `DRAFT`, `PENDING_REVIEW`, `REJECTED`, or `ARCHIVED` products.
- Seller insert with `status = ACTIVE` fails with an RLS violation.
- Seller insert with `status = DRAFT` succeeds for that seller's own `seller_id`.
- Seller update from `DRAFT` to `ACTIVE` fails with an RLS violation.
- Admin update from `DRAFT` to `ACTIVE` succeeds.
- Admin update from `PENDING_REVIEW` to `REJECTED` succeeds.
- Admin update from `ACTIVE` to `ARCHIVED` succeeds.

## Expected Lifecycle

Seller-side:

`DRAFT -> PENDING_REVIEW`

Admin-side:

`PENDING_REVIEW -> ACTIVE`

`PENDING_REVIEW -> REJECTED`

`ACTIVE -> ARCHIVED`

Public buyer visibility:

Only `ACTIVE` products are visible.

## Stop Conditions

Stop immediately if:

- Any SQL error appears mid-run.
- Verification output does not match the expected comments.
- Anonymous users can read non-`ACTIVE` products.
- Sellers can insert or update products directly to `ACTIVE`.
- Sellers can edit another seller's products.
- Any policy unexpectedly disappears outside the product lifecycle scope.

## Rollback Caution

Postgres enum values cannot be removed once added. `PENDING_REVIEW` and `REJECTED` are harmless if unused, but they should not be treated as reversible.

Policy rollback is possible by re-running the relevant `0002_catalog_layer.sql` policy blocks manually after review.

Never rollback by dropping catalog tables, truncating products, deleting live rows, or disabling RLS.

## Final Status Wording

Before manual apply:

`WAIT: 0004 lifecycle migration is prepared in repo only. Live Supabase untouched.`

After successful manual apply and verification later:

`APPLIED: Seller product lifecycle 0004 is live. Sellers cannot self-publish; admins control ACTIVE/REJECTED/ARCHIVED moderation.`
