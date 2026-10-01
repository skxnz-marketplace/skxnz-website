# SKXNZ data architecture (since Phase 1B, 2026-10-01)

## Canonical runtime source

**Supabase project `skxnz` is the only runtime source of catalogue truth** for every
buyer-facing surface: shop, product pages, brand and category pages, search, discovery
navigation, homepage Trending / Brand Spotlight / Signal Room tiles, the AI assistant and
the AI stylist (buyer assistant + outfit builder), community product references, the
sitemap, and the structured data on those pages.

Tables (live schema): `products` (ACTIVE = public), `product_variants`, `product_images`,
`brands` (`is_active`), `categories` (`is_active`). Product photos are in Storage bucket
`product-images`.

## Public read path

```
page / route handler
   └─ lib/catalog/public-catalog.ts      ← the canonical public catalogue layer
        └─ lib/supabase/public-catalog.ts  publishable key, no cookies, RLS decides
             └─ Supabase (anon role)
```

- Use `lib/catalog/public-catalog.ts` for **every** public catalogue read:
  `listActiveBrands`, `findActiveBrandBySlug`, `listActiveCategories`,
  `findActiveCategoryBySlug`, `listActiveProducts({ brandId?, categoryId?, limit? })`,
  `findActiveProduct(slugOrId)`, `listTrendingProducts`, `searchCatalog`.
- Products always come back **with** brand, category, active variants and images. If any
  relation read fails, the whole read fails. A product is never shown with its brand
  silently missing.
- Seller and admin reads stay in `lib/catalog/queries.ts` on `lib/supabase/server.ts` (the
  signed-in user's cookies). The service-role client (`lib/supabase/admin.ts`) is never
  used for public reads.
- Client components get live data either as props from the server page, or from
  `/api/search/suggestions` and `/api/catalog/navigation`.

## Error semantics

Every public read returns `CatalogResult<T>`:

| State | Shape | Meaning |
|---|---|---|
| SUCCESS_WITH_DATA | `{ ok: true, data }` (non-empty) | normal |
| SUCCESS_EMPTY | `{ ok: true, data: [] \| null }` | a real answer: no rows / not found |
| QUERY_ERROR | `{ ok: false, error: { operation } }` | the read failed |

- The full database error (code + message) is logged server-side as
  `[catalog] <operation> failed …`. Callers only get the operation name, and users never
  see database detail.
- Pages where the catalogue *is* the content throw via `unwrapCatalog` /
  `CatalogUnavailableError`. The route error boundary renders "Signal Interrupted" with a 5xx.
- Secondary sections (homepage rows, "similar products") render nothing on error.
- APIs return **503** (`/api/search/suggestions`, `/api/catalog/navigation`,
  `/api/ai-assistant`, `/api/ai/buyer-assistant`, `/api/ai/outfit-builder`).
- A missing product, brand or category is a real **404** (`notFound()`).
- The sitemap is rendered per request and fails with a 5xx rather than publishing a
  sitemap with entities missing.
- Static params for product, brand and category pages come from live slugs. On a
  catalogue error they pre-render nothing (pages render on demand) instead of failing the
  build. The build still fails if a *pre-rendered* page's read fails, which is a deliberate
  gate: no deploy can bake a broken catalogue into static HTML.

## Fallback policy

Demo or generated catalogue data may reach a buyer surface **only** through
`lib/catalog/demo-fallback.ts#isDemoCatalogueEnabled()`:

- It is true only if `NODE_ENV !== "production"` **and**
  `NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE=1`.
- It is impossible in a production build.
- It is meant for local work without a configured backend, component demos and tests.

A failed query, an RLS error or an unreadable relation never triggers it.

## Non-runtime sources

| Kind | Where | Role |
|---|---|---|
| Fixture / demo catalogue | `src/data/*`, `lib/data/{products,brands}.ts` | Dev fixtures (behind the switch), cart/wishlist types, the browser-local marketplace store. Never production truth |
| Import-only | `project-data/source-sheets/*.xlsx` → `scripts/import-sheet-data.py` → `src/data/*` | Regenerates fixtures only; never writes to Supabase |
| Seed | `supabase/seeds/*.sql` | One-off, manual |
| Schema / RLS | `supabase/migrations/NNNN_*.sql` (+ `supabase/verification/`) | The only way to change policies |

## Production-data rules

- Catalogue facts change through the admin/seller UI or a reviewed migration or seed, with
  founder approval for production data.
- RLS changes ship as a new migration, validated in a rolled-back transaction before
  applying. Never grant `anon` anything on `public.users`.
- Never use service role for public reads.

## Known remaining exceptions

- **Browser-local marketplace store** (`components/marketplace/marketplace-provider.tsx`):
  keeps a fixture catalogue in `localStorage` for cart, wishlist and the seller preview
  tools. Buyer pages now pass live data explicitly, so its fixture paths aren't reached from
  public pages, but it remains a second, client-side product store.
- **Seller product check** (`src/lib/ai/engines.ts#runSellerProductCheckEngine`):
  duplicate detection still compares against the generated catalogue (seller tool, not
  buyer-facing).
- **Editorial imagery:** static homepage sections (e.g. `AuthenticityShowcase`) reuse
  `public/assets/home/trending/*` files that the data-integrity pass flagged as wrong or
  third-party images.
- **Search query collections:** static "collection" and "page" suggestions in the search
  bar are editorial navigation (they link to `/shop?q=…` or site pages), not merchandise.
