# SKXNZ Seller Product Lifecycle 0004 Live Apply Report - 4 July 2026

## Date

4 July 2026

## Purpose

Record the live Supabase apply and verification result for the SKXNZ seller product lifecycle 0004 migration.

## Branch

`local-polish-auth-ui`

## Migration Applied

`supabase/migrations/0004_seller_product_lifecycle.sql`

## Verification Run

`supabase/verification/0004_seller_product_lifecycle_verify.sql`

## Live Apply Result

Success. No rows returned.

## Compact Verification Result

| Check | Result |
| --- | --- |
| admin manage policies use is_admin | PASS |
| enum: product_status has PENDING_REVIEW | PASS |
| enum: product_status has REJECTED | PASS |
| public products remain ACTIVE-only | PASS |
| rls enabled: product_images | PASS |
| rls enabled: product_variants | PASS |
| rls enabled: products | PASS |
| seller draft/pending policies exist | PASS |

## Security Result

- Sellers cannot self-publish `ACTIVE` products.
- Sellers can manage only their own `DRAFT` and `PENDING_REVIEW` product lifecycle.
- Admins can approve, reject, and archive products.
- Public buyers still see `ACTIVE` products only.

## Important Note

- Enum values `PENDING_REVIEW` and `REJECTED` are now live and should not be assumed removable.
- Do not rerun `0004_seller_product_lifecycle.sql` blindly.

## Next Recommended Sprint

- Seller-owned product list from Supabase.
- Seller create product server action saving as `PENDING_REVIEW`.
- Admin product moderation flow.
