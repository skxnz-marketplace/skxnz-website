# Sources of truth

One owner per kind of fact. If two places disagree, the one listed here wins.

| What | Authoritative source | Not authoritative |
|---|---|---|
| Application code | Branch `integrate/recover-missing-work` in this repo | Other branches, other folders or copies, the command pack |
| What is live | Git tag `deployed/…` with the newest date (see DEPLOYMENT.md) | `main` (last deployed 2026-08-08) |
| Production catalogue (products, brands, categories, images, placement) | **Supabase** `skxnz` project, tables `products`, `product_images`, `brands`, `categories`, …, read by `lib/catalog/*` and `lib/supabase/public-catalog.ts` | Anything under `src/data/` or `project-data/` |
| Product photos uploaded by sellers and admins | Supabase Storage bucket `product-images` (path `{seller_id}/{product_id}/{file}`) | `public/assets/**` |
| Database schema, RLS, grants | `supabase/migrations/NNNN_*.sql`, applied in order. Each has a matching check in `supabase/verification/` | `prisma/` (legacy, unused by the app) and the draft docs in `docs/` |
| Environment variable **names** | `.env.example` (placeholders only) | Any `.env.local`, which is per-machine and never committed |
| Environment variable **values** | Vercel project settings (production); each developer's `.env.local` (local) | Docs, chat, commits |
| Deployment | Vercel project `skxnz-website`; production branch UNKNOWN (DEPLOYMENT.md) | Old "push to main auto-deploys" notes |
| Status and history of work | `PROGRESS.md` (newest first) | `docs/archive/**` (historical snapshots) |
| Legal and policy pages | `app/{terms,privacy,shipping,returns,authenticity,seller-terms,community-guidelines,cookies}` | These are unreviewed drafts marked `noindex`. Real legal text needs legal sign-off. |
| Analytics | GA4 `G-DB3L1WH491` in `lib/consent/google-analytics.ts` (consent-gated); Vercel Web Analytics in `app/layout.tsx` | `NEXT_PUBLIC_ANALYTICS_ID` in `.env.example` (not read by code) |

## Catalogue data, in order of authority

1. **Production runtime — Supabase.** The live site reads the catalogue from here. Change catalogue
   facts through the admin UI or a reviewed migration or seed, never by editing files in this repo.
2. **Bulk import source — none designated yet.** The only spreadsheet pipeline is
   `project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx` →
   `scripts/import-sheet-data.py` → `src/data/*.ts`. That sheet is a **June 2026 planning sheet**.
   Its image paths are known to be wrong (six "trending" images show other products or another
   brand's tag). Re-running the script will overwrite the fixes in `src/data/products.ts`. Don't
   treat it as canonical until a data-integrity pass validates it.
3. **Product media manifest — not built yet.** The planned shape is in the workspace-level
   `data/catalog/media-manifest/README.md` (outside this repo). Until it exists, Supabase
   `product_images` is the record for live products.
4. **Raw incoming spreadsheets** (brand or seller catalogues) go into the workspace-level
   `data/catalog/imports/`, **not** this repo. They aren't canonical until validated.
5. **Fallback / development data — `src/data/*.ts`.** Generated demo content. It is **not** the
   production catalogue, but some runtime features still read it directly:
   - site search: `src/lib/site-search.ts`, `components/shared/site-search-bar.tsx`
   - discovery menu: `components/shared/discovery-menu.tsx`
   - brand data: `lib/data/brands.ts`
   - AI assistant and stylist: `src/lib/skxnzAssistant.ts`, `src/lib/ai/*`

   So those features show demo products, not Supabase products. This is the biggest open
   source-of-truth gap; moving them onto Supabase is its own task. See `src/data/README.md`.

## Known data problems (for the data-integrity pass, not fixed here)

- The planning sheet and the product gallery images point at wrong or third-party photos (see PROGRESS.md,
  "Trending image mismatch fix").
- `public/assets` has 27 groups of byte-identical files, including `.webp` files that are PNG
  bytes, and third-party "afterlast" images reused as category and product art. The list is in
  `docs/engineering/ASSET_AUDIT_2026-10-01.md`.
