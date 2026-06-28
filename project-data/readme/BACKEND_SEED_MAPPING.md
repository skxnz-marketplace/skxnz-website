# SKXNZ Backend Seed Mapping

This note explains how the Google Sheet planning files map into the backend seed
artifacts and Prisma schema.

## Source Of Truth

- `project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx`

## Generated Seed Artifacts

- `project-data/processed/master-store.seed.json`
  - products
  - brands
  - categories
  - collections
  - homepage heroes
  - brand heroes
  - carousel slides
  - search index
  - AI outfit metadata
- `project-data/processed/backend-architecture.json`
  - backend tables
  - API routes
  - seed mapping rows
- `project-data/processed/ai-architecture.json`
  - AI modules
  - AI tables
  - AI routes
  - prompt rules

## Sheet To Table Mapping

- `Products`
  - `products`
  - `product_images`
  - `product_variants`
  - `inventory`
  - `search_keywords`
- `Brands`
  - `brands`
  - `brand_heroes`
  - `search_keywords`
- `Categories`
  - `categories`
  - `search_keywords`
- `Homepage Heroes`
  - `homepage_heroes`
- `Brand Page Heroes`
  - `brand_heroes`
- `Carousels`
  - `carousel_slides`
- `AI Modules` and `AI Tables`
  - `ai_jobs`
  - `ai_usage_logs`
  - `ai_audit_logs`
  - `seller_product_validations`

## Important Seed Safety Rules

- Products imported from the planning sheets are seeded as demo catalogue records.
- They must remain marked as demo seed data until real seller inventory exists.
- Payments store only provider, provider reference, amount, currency, and status.
- No real card details, bank details, or live payment secrets belong in seed data.
- Demo brands in the planning sheets are not official partnership claims.
