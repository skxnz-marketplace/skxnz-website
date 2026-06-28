# SKXNZ Backend Setup

This project already uses a Next.js + Prisma + PostgreSQL backend foundation.
The backend prep in this repo expands that existing setup instead of creating a
separate conflicting backend.

## Backend Direction

- Database: PostgreSQL
- ORM: Prisma
- App layer: existing project-compatible Node/Next.js backend foundation
- Seed source of truth: the planning workbooks in `project-data/source-sheets/`

## What The Backend Now Covers

Prepared schema/models for:

- users
- user_profiles
- buyers
- sellers
- riders
- admin_users
- brands
- categories
- collections
- products
- product_images
- product_variants
- inventory
- carts
- cart_items
- wishlists
- wishlist_items
- orders
- order_items
- payments
- shipments
- shipment_events
- returns
- return_items
- refunds
- support_tickets
- support_messages
- reviews
- homepage_heroes
- brand_heroes
- carousel_slides
- search_keywords
- ai_jobs
- ai_usage_logs
- ai_audit_logs
- seller_product_validations
- audit_logs

## Seed Data Source

The catalog/content seed data comes from:

- `project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx`

The repo generates JSON seed artifacts here:

- `project-data/processed/master-store.seed.json`
- `project-data/processed/backend-architecture.json`
- `project-data/processed/ai-architecture.json`

Those files are created by:

- `scripts/import-sheet-data.py`
- `scripts/export-backend-seed-data.py`

## Important Safety Notes

- Demo products are prototype seed data only.
- They are not real live seller inventory.
- Payments store only provider, provider reference, amount, currency, and status.
- Do not store real card details.
- Demo brands in the planning sheets are not official partnership claims.
- Real authentication, real payment capture, and real payout workflows are still separate future work.

## Local Setup

1. Copy the env file:

```bash
cp .env.example .env
```

2. Add a PostgreSQL `DATABASE_URL` in `.env`.

Optional:

- `DIRECT_URL` can be used for hosted Postgres migration/studio workflows.

3. Refresh the frontend sheet-driven data:

```bash
/Users/vrishank/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/import-sheet-data.py
```

4. Refresh the backend JSON seed artifacts:

```bash
/Users/vrishank/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/export-backend-seed-data.py
```

5. Generate Prisma client:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/skxnz?schema=public" ./node_modules/.bin/prisma generate
```

6. Create an offline SQL migration script safely:

```bash
mkdir -p prisma/migrations/20260507_prepare_sheet_backend
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/skxnz?schema=public" ./node_modules/.bin/prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260507_prepare_sheet_backend/migration.sql
```

7. If you have a real local or staging PostgreSQL database ready, apply the schema safely with one of these:

```bash
./node_modules/.bin/prisma db push
```

or

```bash
./node_modules/.bin/prisma migrate dev --name prepare_sheet_backend
```

8. Seed the database:

```bash
./node_modules/.bin/prisma db seed
```

## Recommended Verification

Run:

```bash
./node_modules/.bin/prisma format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/skxnz?schema=public" ./node_modules/.bin/prisma generate
./node_modules/.bin/eslint .
./node_modules/.bin/next build
./node_modules/.bin/tsc --noEmit
node scripts/check-colors.mjs
```

If you do not have a live PostgreSQL database yet, skip `db push`, `migrate dev`, and `db seed` until `DATABASE_URL` points to a safe local or staging instance.
