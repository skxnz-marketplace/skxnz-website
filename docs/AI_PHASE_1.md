# SKXNZ AI Phase 1 Foundation

This Phase 1 foundation uses the planning workbook in:

- `project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx`

and the processed data in:

- `project-data/processed/ai-architecture.json`
- `project-data/processed/master-store.seed.json`

## Phase 1 Features

- Buyer AI Assistant
- AI Outfit Builder
- Seller Product Validation
- Backend AI Data Handler

## Current Execution Mode

- Default mode: local structured marketplace data
- Frontend never receives provider API keys
- All AI calls go through backend route handlers

## Phase 1 Routes

- `POST /api/ai/buyer-assistant`
- `POST /api/ai/outfit-builder`
- `GET /api/ai/outfit-results/:id`
- `POST /api/ai/seller-product-check`
- `GET /api/ai/usage`
- `GET /api/ai/audit-logs`

## Future Try-On Stubs

- `POST /api/ai/try-on/jobs`
- `GET /api/ai/try-on/jobs/:id`

These stubs do not activate personal photo upload or storage.

## Safety Rules

- Recommend only products that exist in structured SKXNZ data
- Do not invent brands, products, partnerships, prices, or fit guarantees
- Do not auto-publish seller products
- Seller uploads still require admin review
- Do not store personal try-on photos without explicit consent and deletion policy

## Data Used By Phase 1

- Products
- Brands
- Categories
- Collections
- Search keywords
- AI outfit metadata
- Stock, size, color, and price fields from structured sheet-derived data
