# SKXNZ Project Data

This folder stores the planning spreadsheets and future structured data exports for SKXNZ.

## Purpose

- Keep the planning sheets versioned alongside the app.
- Separate raw planning files from future CSV exports and processed seed data.
- Make it clear which documents are the source of truth before data is converted into app logic.

## Folder Structure

- `project-data/source-sheets/`
  - Raw spreadsheet source files used for planning and future implementation.
- `project-data/csv/`
  - Expected CSV exports derived from the source sheets.
- `project-data/processed/`
  - Cleaned or transformed data files ready for seed generation, indexing, or import scripts.
- `project-data/readme/`
  - Extra notes, mapping docs, and implementation references if needed later.

## Source Of Truth Sheets

These spreadsheet files are the current source of truth:

- `project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx`
  - Primary store data planning for products, brands, categories, homepage content, and search-related content.
- `project-data/source-sheets/SKXNZ_BACKEND_ARCHITECTURE_PACK_FINAL.xlsx`
  - Backend architecture planning for tables, routes, workflow structure, and system design.
- `project-data/source-sheets/SKXNZ_AI_OPERATING_SYSTEM_PACK_FINAL.xlsx`
  - AI feature and operating-system planning for AI modules, AI routes, and AI workflow design.

## Expected CSV Exports

If CSV exports are created from the sheets, they should be stored here:

- `project-data/csv/products.csv`
- `project-data/csv/brands.csv`
- `project-data/csv/categories.csv`
- `project-data/csv/homepage-heroes.csv`
- `project-data/csv/brand-page-heroes.csv`
- `project-data/csv/carousels.csv`
- `project-data/csv/search-index.csv`
- `project-data/csv/backend-tables.csv`
- `project-data/csv/api-routes.csv`
- `project-data/csv/ai-modules.csv`
- `project-data/csv/ai-routes.csv`

## How Data Should Flow Into The App

Recommended conversion path:

1. Update the planning spreadsheets in `source-sheets/`.
2. Run `scripts/import-sheet-data.py` to parse the XLSX files directly when the importer runtime is available.
3. If direct XLSX parsing is unavailable, export the relevant tabs to CSV files in `project-data/csv/`.
4. Normalize and validate those CSV files into app-ready JSON, TS modules, or seed payloads in `project-data/processed/`.
   Current processed outputs include:
   - `project-data/processed/master-store.seed.json`
   - `project-data/processed/backend-architecture.json`
   - `project-data/processed/ai-architecture.json`
5. Use the processed outputs to update:
   - demo product seed data
   - demo brand seed data
   - homepage and brand hero content
   - search index inputs
   - backend seed and route scaffolding
   - AI placeholder module configuration

## Backend Prep Note

For backend preparation, run:

1. `scripts/import-sheet-data.py`
   - updates the TypeScript app data modules from the sheets.
2. `scripts/export-backend-seed-data.py`
   - creates JSON seed artifacts in `project-data/processed/` for Prisma/backend seeding.

## Important Warning

The current demo products in the app are prototype seed data only.

They are not real live seller inventory, not production commerce data, and not proof of active marketplace operations. Any future migration from the planning sheets into the app must preserve that distinction until real seller onboarding and real inventory systems are connected.

## Current Note

For safety, the spreadsheet files placed in `source-sheets/` are tracked project copies of the planning exports. They should be treated as reference inputs and not rewritten by app code directly.
