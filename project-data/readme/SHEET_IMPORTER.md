# SKXNZ Sheet Importer

Use `/Users/vrishank/Downloads/SKXNZ_PROJECT_ECOSYSTEM_COMMAND_PACK 2/website/scripts/import-sheet-data.py`
to convert the planning workbooks into structured TypeScript app data.

Use `/Users/vrishank/Downloads/SKXNZ_PROJECT_ECOSYSTEM_COMMAND_PACK 2/website/scripts/export-backend-seed-data.py`
to convert the same planning workbooks into JSON seed artifacts for Prisma/backend preparation.

## Direct XLSX Path

The importer reads these files directly:

- `project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx`
- `project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx`

## Tabs The Importer Uses

Master store workbook:

- `Products`
- `Brands`
- `Categories`
- `Homepage Heroes`
- `Brand Page Heroes`
- `Carousels`

Backend workbook:

- `Backend Tables`
- `API Routes`
- `Seed Mapping`

AI workbook:

- `AI Modules`
- `Data Sources`
- `AI Tables`
- `API Routes`
- `Outfit Builder`
- `Buyer Assistant`
- `Prompt Rules`

## If XLSX Parsing Is Not Available

Export the same tabs to CSV and place them in `project-data/csv/` using the
same headers. The importer script documents the expected tab names and field
shape so the CSV path can be added later without changing the app layer.

## Output Files

The importer writes:

- `src/data/products.ts`
- `src/data/brands.ts`
- `src/data/categories.ts`
- `src/data/homepageHeroes.ts`
- `src/data/brandPageHeroes.ts`
- `src/data/carousels.ts`
- `src/data/searchIndex.ts`
- `src/data/collections.ts`
- `src/data/aiOutfitMetadata.ts`

The backend JSON exporter writes:

- `project-data/processed/master-store.seed.json`
- `project-data/processed/backend-architecture.json`
- `project-data/processed/ai-architecture.json`

## Important Note

Structured data imported from the sheets is planning and seed content.
Demo marketplace products remain prototype seed data until real seller
inventory and production backend workflows are connected.
