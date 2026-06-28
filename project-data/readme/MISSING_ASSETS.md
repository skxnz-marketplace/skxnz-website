# SKXNZ Content Asset Fallbacks

## Controlled Placeholder Policy

When a sheet-driven image path is missing or empty, the website must fall back to controlled SKXNZ-owned local assets instead of showing a broken image box.

Current controlled fallbacks:

- Product/media fallback: `/assets/demo/products/product-01.webp`
- Brand/logo fallback: `/assets/brand/skxnz/logo-mark-transparent.png`

## Current Source-of-Truth Flow

The planning sheets in `project-data/source-sheets/` remain the source of truth.

The importer at `scripts/import-sheet-data.py` converts those sheets into:

- `src/data/products.ts`
- `src/data/brands.ts`
- `src/data/categories.ts`
- `src/data/homepageHeroes.ts`
- `src/data/brandPageHeroes.ts`
- `src/data/carousels.ts`
- `src/data/searchIndex.ts`
- `src/data/collections.ts`
- `src/data/aiOutfitMetadata.ts`

## Important Note

Some sheet rows currently map to approved local demo/editorial assets because the exact final brand or product image exports are not yet present in the repository. Those mappings are intentional controlled placeholders for the SKXNZ prototype and should be replaced only with approved local assets later.
