# SKXNZ live data architecture audit (Phase 1A, 2026-10-01)

Read-only audit of `integrate/recover-missing-work` @ `08e62f1` (repo `SKXNZ/code/web`), with
read-only checks against the live Supabase project `skxnz` (`hhsorrkvgvxxpwzrggei`, the project
`.env.local` points at) and public GETs of https://skxnz.com.

Evidence tags: **[PROVEN]** = reproduced or read directly; **[LIKELY]** = strongly implied by
code, not reproduced; **[UNKNOWN]** = needs live verification.

Live checks run, all read-only:
- anonymous PostgREST `GET`s with the publishable key (the same calls the site makes)
- `SELECT`s via the Supabase connector on `pg_policies`, `information_schema.role_table_grants`,
  `supabase_migrations.schema_migrations` and catalogue row counts
- public `curl` of skxnz.com pages

Nothing was written anywhere.

---

## 1. Executive summary

- **Supabase is not the effective source of truth for anonymous visitors.** Anonymous `SELECT` on
  `brands` and `categories` fails with `42501 permission denied for table users`. Every reader
  that touches brands or categories then silently swaps in demo data or drops data. **[PROVEN]**
- **Production is affected now.** https://skxnz.com/shop renders 5 demo-only products and 0 of
  the 7 live ones. **[PROVEN]**
- **Several surfaces never read Supabase at all:**
  - site search (local index)
  - the discovery menu
  - homepage Brand Spotlight
  - the AI assistant and AI stylist engines
  - static params for product, brand and category pages

  **[PROVEN]**
- **A QA test product is publicly ACTIVE** (`skxnz-qa-test-approval-01-bd37e28c`, ₹248, no
  images) and appears in production homepage Trending Now. **[PROVEN]**
- **The live schema has drifted from the repo:**
  - two live policies don't exist in any migration file
  - the live migration history only records 0017 onward

  **[PROVEN]**
- **Checkout is not at risk of selling demo items at demo prices.**
  `create_order_intent_atomic` re-resolves every line in the DB (ACTIVE only, DB prices). Demo
  items can still reach the cart and then fail at checkout. **[PROVEN / LIKELY]**

## 2. Canonical-data status today

| Surface | Effective source for an anonymous visitor (local + prod) |
|---|---|
| Homepage Trending Now | **Live** products (7 active ≥ 6 needed). Brand names blank because the brands read fails |
| Homepage Brand Spotlight / hero / mosaic | Demo / static (`lib/data/brands`, `lib/home-data`) |
| Shop | **Demo** (`approvedProducts`). Live relation read fails, so the shop falls back |
| Product page | Live if the slug or id exists, else **demo** seed product |
| Brands index | **Demo** (`demoBrands`); the live read fails |
| Brand page | **Demo** shell. Live lookup fails; static params come from demo brands |
| Category page | **Demo** structured category (live lookup fails; static params from demo) |
| Search suggestions | **Demo** local index (the live call reports `live:false`) |
| Discovery menu | **Demo**, hard-wired |
| AI assistant / stylist | **Demo / generated**, hard-wired |
| Sitemap | Live products (incl. the QA product); **brands and categories silently omitted** |
| Cart / checkout | Cart types are demo; order creation is **live and DB-authoritative** |

Logged-in visitors get different results for brands and categories, because `authenticated` *can*
read `users`. Behaviour depends on auth state. **[PROVEN mechanism, LIKELY outcome per page]**

## 3. Data-source inventory

| # | Data source | Location | Table / file | Consumers | Class | Side | Auth context | Failure behaviour |
|---|---|---|---|---|---|---|---|---|
| S1 | Supabase, cookie-less public client | `lib/supabase/public-catalog.ts` | `products`, `brands` (`categories` in sitemap) | `getActiveBrands*`, `getActiveProducts`, `getTrendingProducts`, `app/sitemap.ts` | LIVE | server | always `anon` | logs a warning, returns `[]` |
| S2 | Supabase, per-request SSR client | `lib/supabase/server.ts` | `products`, `brands`, `categories`, `product_variants`, `product_images` | most `lib/catalog/queries.ts` readers | LIVE | server | `anon`, or the signed-in user | logs a warning, returns `[]` / `null` |
| S3 | Supabase browser client | `lib/supabase/client.ts` | auth only | `components/auth/*` | LIVE (auth) | client | user | — |
| S4 | Supabase service role | `lib/supabase/admin.ts` | support tables | `lib/support/admin-support-actions.ts` only | LIVE (admin) | server | bypasses RLS | throws if not configured |
| S5 | Supabase Storage | bucket `product-images` (0018) | product photos | `lib/catalog/upload-actions.ts`, images | LIVE | both | RLS on `storage.objects` | — |
| S6 | Demo catalogue | `src/data/demo-products.ts` (re-exported by `lib/data/products.ts`) | 15 products | shop fallback, PDP fallback and static params, cart types, assistant, wishlist, community | DEMO | both | none | always available |
| S7 | Generated catalogue | `src/data/{products,brands,categories,collections,carousels,homepageHeroes,brandPageHeroes,searchIndex,aiOutfitMetadata}.ts` | from the planning sheet | site search, category pages, AI engines | DEMO / generated | both | none | always available |
| S8 | Demo brands | `src/data/demo-brands.ts`, `demo-brand-metrics.ts` (via `lib/data/brands.ts`) | — | brands index and brand page fallback, discovery menu, search, Brand Spotlight, assistant | DEMO | both | none | always available |
| S9 | Static homepage content | `lib/home-data.ts` | — | hero carousel, mosaic, product row types | STATIC | server | none | — |
| S10 | Planning spreadsheets | `project-data/source-sheets/*.xlsx` | — | `scripts/import-sheet-data.py` → S7 | IMPORT-ONLY | offline | none | — |
| S11 | Processed seed JSON | `project-data/processed/*.json` | — | `scripts/export-backend-seed-data.py` (Prisma-era) | IMPORT-ONLY / unused | offline | none | — |
| S12 | SQL seed | `supabase/seeds/0002_catalog_seed.sql` | catalogue rows | manual application | IMPORT-ONLY | offline | DB owner | — |
| S13 | Prisma | `prisma/schema.prisma`, `lib/prisma.ts` | — | **0 importers** | UNUSED | — | — | — |

**13 distinct sources** in total: 5 live Supabase paths and 8 local or offline ones.

## 4. Buyer-surface dependency map

Format: UI → page → helper → source. ⚠ marks a point where the source can switch.

- **Homepage**: `app/page.tsx` → `getActiveBrands()` (S1: brands → **fails for anon**) +
  `getTrendingProducts(6)` (S1: products only, **works**). ⚠ If fewer than 6 live products,
  `trendingSection` = `lib/data/products` approved demo pool (`app/page.tsx` ~l.56–61). Brand
  names come from the failed brands read, so they are empty. Other sections are S8/S9.
- **Shop**: `app/shop/page.tsx#getLiveShopCatalog` → `getActiveProductsWithRelations()` (S2).
  - products read: OK
  - relation batch: `brands` + `categories` **fail** → returns `[]`
  - ⚠ `components/buyer/shop-catalog.tsx:25-26`: `hasLiveProducts ? liveProducts : approvedProducts` (demo)
- **Product page**: `app/product/[id]/page.tsx#resolveProduct` →
  `getActiveProductBySlug` → `getProductById` (S2). The relation reads destructure only `data`
  and ignore `error` (`lib/catalog/queries.ts` ~l.508–539). For anon, a **live** PDP therefore
  renders with `brand`/`category` silently `null`: no brand name, degraded breadcrumb and
  JSON-LD. **[PROVEN by code]** ⚠ A miss, 2.5 s timeout or
  exception falls back to `getSeedProductById` (S6). Static params come from S6 (`products.map`, l.36).
  JSON-LD Product + Breadcrumb is emitted for whichever product resolved, so **demo products get
  structured data**. `offers` is deliberately omitted.
- **Brands index**: `app/brands/page.tsx` → `getActiveBrands` (S1, **fails**) + `getActiveProducts`.
  ⚠ l.30 `liveDemoBrands.length > 0 ? live : demoBrands`.
- **Brand page**: `app/brands/[slug]/page.tsx` → `getActiveBrandBySlug` (S2, **fails** for anon).
  ⚠ name and shell fall back to `getDemoBrandBySlug` (S8). Static params come from `demoBrands`
  (l.17). JSON-LD is emitted.
- **Category page**: `app/categories/[slug]/page.tsx` → `getActiveCategoryBySlug` (S2, **fails**
  for anon). ⚠ Falls back to `getStructuredCategoryBySlug` (S7, l.92). Static params come from S7
  plus the hard-coded `women`, `ai-styled` and `shoes`. JSON-LD is emitted.
- **Search**: `components/shared/site-search-bar.tsx` → `/api/search/suggestions` →
  `searchActiveProducts` (S2). The relation batch fails, so it returns `live:false`. ⚠ The bar
  then uses local `buildSearchSuggestions` over S6/S7/S8 (l.~175–198). Brands are always
  `demoBrands`. `/shop?q=` filters the (demo) shop list via `src/lib/site-search.ts`.
- **Discovery menu**: `components/shared/discovery-menu.tsx:119` `topBrands = demoBrands.slice(0,6)`.
  Hard-wired demo.
- **AI assistant**: `/api/ai-assistant` → `src/lib/skxnzAssistant.ts` (S6 `demoProducts`, S8,
  `aiOutfitMetadata`). Hard-wired demo. Product cards link to demo product pages.
- **AI stylist and AI APIs**: `app/api/ai/*` → `src/lib/ai/service` → `engines.ts` / `catalog.ts`
  (S7 `structuredProducts`). Hard-wired generated data.
- **Cart / checkout**:
  - cart state: `components/marketplace/marketplace-provider.tsx` (demo `Product` types, S6)
  - checkout preview: `lib/checkout/checkout-review.ts`
  - order creation: `lib/orders/create-order-intent.ts` → RPC `create_order_intent_atomic`
    (0011). It resolves each line by `product_id` or `product_slug`, requires ACTIVE, and uses
    DB data. ⚠ Demo items reach the cart but fail with `SKXNZ_PRODUCT_UNAVAILABLE` (only
    `midnight-cargo-pants` collides with a live slug).
- **Community**: `lib/community/read-community.ts` → `getActiveProductsWithRelations` (S2). The
  relation failure means tagged-product lookups are empty for anon. **[LIKELY]**
- **Sitemap**: `app/sitemap.ts` → `getActiveBrandsDetail` (S1, **fails**, so no brand URLs),
  `getActiveCategorySlugs` (S1, **fails**, so `[]`), and `getActiveProducts` (S1, works: 7 URLs
  incl. the QA product). ⚠ Failures are swallowed silently.
- **Structured data**: generated per page from whatever resolved (live or demo). Site-wide
  Organization/WebSite JSON-LD is in `app/layout.tsx` (static).

## 5. Supabase client map

| Client | File | Key | Session | Used by catalogue readers |
|---|---|---|---|---|
| Browser | `lib/supabase/client.ts` | publishable | browser cookies | none (auth UI only) |
| Server (SSR) | `lib/supabase/server.ts` | publishable | request cookies (anon or user) | categories, brand/category pages, PDP, shop relations, search, community |
| Public catalogue | `lib/supabase/public-catalog.ts` | publishable | none (always `anon`) | brands index, trending, sitemap |
| Middleware | `middleware.ts` (`createServerClient`) | publishable | request cookies | auth gate only |
| Service role | `lib/supabase/admin.ts` | secret | none (bypasses RLS) | support admin only, **not buyer-facing** |

Flags:
- The **same logical read uses different clients**. Brands are read through S1 on the
  index/homepage/sitemap but through S2 on brand pages. Categories use S2 except in the sitemap.
  **[PROVEN]**
- Public catalogue reads through the SSR client make results depend on login state, and make
  pages dynamic. **[PROVEN mechanism]**
- No service-role client is used in buyer code. **[PROVEN]**
- There are two data-access layers: `lib/catalog/queries.ts` (live) and
  `src/lib/{site-search,skxnzAssistant,ai/*,catalog-content}.ts` (demo). **[PROVEN]**

## 6. Catalogue logical model (live)

| Table | Purpose | Key relationships | Public read expected? | RLS | Live anon result | Consumers |
|---|---|---|---|---|---|---|
| `products` | catalogue items | `brand_id`→brands, `category_id`→categories, `seller_id`→users | YES (ACTIVE) | yes | 200 | S1/S2 readers, order RPC |
| `product_variants` | sizes/options, price | `product_id`→products | YES (for ACTIVE) | yes | 200 | relation batches, order RPC |
| `product_images` | gallery (`storage_path`, `sort_order`) | `product_id`→products | YES (for ACTIVE) | yes | 200 | relation batches |
| `brands` | brand records | — | YES (`is_active`) | yes | **401 / 42501** | brands, sitemap, relations |
| `categories` | category records | — | YES (`is_active`) | yes | **401 / 42501** | categories, sitemap, relations |
| `users` | account + `role` (BUYER/SELLER/ADMIN) | auth.users | NO | yes | 401 (anon has no SELECT) | RLS subqueries, order RPC |
| `user_profiles`, `addresses` | buyer data | users | NO | yes | — | account/checkout |
| `orders`, `order_items`, … | commerce | products, users | NO | yes (revoked from anon/auth, RPC-only) | — | order RPCs |
| `community_posts`, `style_boards` | community | products (tagged ids) | YES (published) | yes | 200 | community |

Live counts:
- products: 7 ACTIVE, one of them a QA test item
- brands: 11 active
- categories: 6 active
- variants: 16 active
- images: 6
- curated trending: 0

The live product slugs share almost nothing with the 15 demo slugs (only `midnight-cargo-pants`).
**[PROVEN]**

## 7. Fallback matrix

| # | Location | Trigger | Result | Class |
|---|---|---|---|---|
| F1 | `components/buyer/shop-catalog.tsx:25-26` (+ `app/shop/page.tsx` `getLiveShopCatalog`) | live list empty, incl. relation failure | whole shop becomes demo products | **C**: proven in production |
| F2 | `app/product/[id]/page.tsx` `resolveProduct` | live miss, exception or 2.5 s timeout | demo PDP with canonical + JSON-LD | **C** |
| F3 | `app/brands/page.tsx:30` | live brands empty | `demoBrands` | **C** |
| F4 | `app/brands/[slug]/page.tsx` (~l.55–62) | live brand null | demo brand name/shell | **C** |
| F5 | `app/categories/[slug]/page.tsx` (~l.77–92) | live category null | structured demo category + products | **C** |
| F6 | `app/page.tsx` (~l.56–61) | fewer than 6 live trending | approved demo pool | **C**: dormant today (7 live) |
| F7 | `site-search-bar.tsx` / `queries.ts#searchActiveProducts` | relation failure, `live:false` | local demo suggestions | **C** |
| F8 | `app/sitemap.ts` `getActiveCategorySlugs` + `getActiveBrandsDetail` | query error | entries silently omitted | **C**: silent data loss for SEO |
| F9 | `queries.ts` (every reader) | any error | `console.warn` + `[]` / `null` | **D**: the root of F1–F8; callers can't tell "empty" from "broken" |
| F9b | `queries.ts#getProductBySlug` / `getProductById` relation reads | brand/category error | errors ignored, so `brand`/`category` = `null` on a live PDP | **C** |
| F10 | `discovery-menu.tsx:119`, `brand-spotlight.tsx`, `skxnzAssistant.ts`, `src/lib/ai/*` | always | demo data | **C** (hard-wired, not conditional) |
| F11 | `queries.ts#isMissingTableError` paths | table missing | empty, no warning | **A**: dev/bootstrap |
| F12 | `getSellerProductsWithRelations` with no user | not signed in | `[]` | **B** |
| F13 | order RPC rejects a demo item | demo item in cart | `SKXNZ_PRODUCT_UNAVAILABLE` error | **B**: honest error, poor UX |

**9 conditional silent production fallbacks (F1–F8, F9b) plus 4 hard-wired demo surfaces (F10).**

## 8. Root cause: `permission denied for table users`: **PROVEN**

1. **Caller.** The failing reads are anonymous `SELECT`s on `public.brands` and
   `public.categories`, either direct (`getActiveBrands*`, `getActiveCategory*`) or in relation
   batches (`supabase.from("brands"|"categories").select("*").in("id", …)`). The query itself
   never references `users`: there are no nested selects or joins (`lib/catalog/queries.ts`).
2. **Policy.** Live `pg_policies` on both tables include
   `"<table>: admin can select all"` with `roles = {public}`, which includes `anon`. Its qual is
   `EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')`. Source:
   `supabase/migrations/0002_catalog_layer.sql:171` (brands) and `:219` (categories).
3. **Evaluation.** Postgres ORs all permissive policies, so this subquery is planned for an anon
   `SELECT` even though `brands: public can select active` would allow the row. The subquery
   runs with the caller's privileges.
4. **Privilege.** Live grants: `anon` has **no SELECT on `public.users`** (`REFERENCES, TRIGGER,
   TRUNCATE` only); `authenticated` has SELECT. Result: `42501 permission denied for table
   users` for anonymous visitors, success for signed-in ones.
5. **Precedent.** The same defect was already fixed for:
   - `products`: 0013 moved admin-select to `authenticated` + `is_admin()`
   - `product_variants` / `product_images`: 0015's header describes this exact mechanism

   It was **never fixed for `brands` and `categories`.** The `INSERT`/`UPDATE`/`DELETE` admin
   policies on both tables still use the same inline pattern (not hit by reads).

Reproduced live by anonymous GET:
- `brands` → 401 `42501`
- `categories` → 401 `42501`
- `products`, `product_variants`, `product_images` → 200

Not the cause (ruled out): foreign-key expansion, nested PostgREST selects, views, Prisma
relations, name collisions.

## 9. Import / export pipeline

```
project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx  (June 2026 planning sheet)
   └─ scripts/import-sheet-data.py ─────► src/data/*.ts  (S7: products, brands, categories,
                                           collections, heroes, searchIndex, aiOutfitMetadata)
   └─ scripts/export-backend-seed-data.py ► project-data/processed/*.json (Prisma-era, unused)
supabase/seeds/0002_catalog_seed.sql ───► Supabase (manual, one-off)
Admin/seller UI (upload-actions, admin-placement-actions) ─► Supabase products/images/Storage
data/catalog/imports (workspace) ───────► nothing yet (staging only)
```

- **Authoritative per stage:**
  - Supabase for the live catalogue
  - the sheet for the generated `src/data` files only
  - nothing for media (no manifest yet)
- **Can reintroduce bad data:** re-running `import-sheet-data.py` overwrites `src/data/products.ts`
  and **undoes the manual Trending image fix (`ad73c1e`)**, because the sheet still has the wrong
  image paths. Since search, the assistant, the discovery menu and the shop fallback all read
  `src/data`, a re-import changes what visitors see. **[PROVEN by code path; not executed]**
- Nothing syncs `src/data` into Supabase or the reverse, so the two catalogues are independent
  and already disagree. **[PROVEN]**

## 10. Duplicate and dead systems

- **Prisma** (`prisma/`, `lib/prisma.ts`): 0 importers, but `postinstall` still runs `prisma generate`.
- **Two product types:** `lib/catalog/types.ts` (DB shape) and `src/data/demo-products.ts`
  `Product` (buyer shape, used by cart, checkout and components). `lib/catalog/mappers.ts` bridges
  them.
- **Two brand models:** `brands` (DB) and `DemoBrand` (`src/data/demo-brands.ts`).
  `mapBrandToDemoBrand` converts live brands into the demo shape.
- **Two search systems:** `searchActiveProducts` (live) and `src/lib/site-search.ts` +
  `src/data/searchIndex.ts` (local).
- **Two AI catalogue layers:** `src/lib/skxnzAssistant.ts` (S6) and `src/lib/ai/catalog.ts` (S7),
  both demo.
- **Unused data:**
  - `project-data/processed/*.json` and `export-backend-seed-data.py` (Prisma-era)
  - `project-data/csv/` (empty)
- **Looks authoritative but isn't:** `src/data/products.ts` (labelled FALLBACK in Phase 0), plus
  `lib/data/products.ts` / `lib/data/brands.ts`, whose names suggest the real data layer.

## 11. Production vs local divergence

- **Env vars in local `.env.local`** (names only):
  - present: `NEXT_PUBLIC_SUPABASE_URL` (project `hhsorrkvgvxxpwzrggei`), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
  - missing: `NEXT_PUBLIC_SITE_URL` (defaults to https://skxnz.com), `AI_PROVIDER` (defaults to local), `OPENAI_API_KEY`

  Production env values: **[UNKNOWN]** (Vercel not inspected).
- **Same database for local and production.** **[LIKELY]**: production renders live product
  slugs from the same project.
- **Auth state changes results:** brands and categories work signed-in and fail anonymous.
  **[PROVEN mechanism]**
- **Build time:** static params come from demo data, so demo product, brand and category pages are
  pre-rendered at build. **[PROVEN]**
- **Deployed code differs from this branch.** Production runs `06d78d5`, 36 commits behind: its
  sitemap has 0 catalogue entries, while this branch's dynamic sitemap lists 7 products only.
  **[PROVEN]**
- **Schema drift:**
  - the live policies `brands: active public select` and `categories: active public select` (roles anon, authenticated) are in no migration file
  - `supabase_migrations.schema_migrations` lists only `0017*` and `0018`, so 0001–0016 were applied outside the tracked history

  **[PROVEN]**

## 12. Risks ranked

**BLOCKER**
1. Anonymous `brands`/`categories` reads fail (§8), which feeds F1–F8: the public shop, brands,
   categories and search show demo data.
2. Production `/shop` serves demo products to every visitor, and search engines can index them.

**HIGH**

3. A QA test product (`skxnz-qa-test-approval-01-bd37e28c`, ₹248, no images) is ACTIVE and
   shown in production Trending Now, and this branch would add it to the sitemap.
4. Demo pages are pre-rendered and indexable (static params from S6/S7/S8, plus PDP/brand/category
   JSON-LD on demo content) while the live catalogue is different. The "what SKXNZ sells" signal
   is inconsistent.
5. Every query helper turns errors into `[]`/`null` (F9), so a broken query can't be told apart
   from an empty catalogue anywhere in the UI.
6. Schema drift: live policies aren't in migrations, and 0001–0016 are untracked. The repo can't
   reproduce production's security boundary.

**MEDIUM**

7. Search, discovery, Brand Spotlight and the AI assistant/stylist are hard-wired to demo data,
   so they recommend products that don't exist live and fail at checkout.
8. The same reads use different clients (public vs SSR), so results and caching vary with auth.
9. Re-running the sheet importer undoes the image fixes and changes what visitors see.
10. Demo items reach the cart and fail at checkout (honest error, broken UX).

**LOW**

11. Prisma is dead but still runs at install.
12. There are duplicate type/brand models and two search systems (maintenance cost).
13. The sitemap swallows errors silently (also part of the blocker chain).

## 13. Recommended Phase 1B fix sequence

1. **Codify live state first.** Dump the live policies and grants into a migration or snapshot so
   the repo matches production, including the 2 drift policies, before changing anything.
2. **Fix brands and categories RLS:** apply the 0013/0015 pattern. Restrict the
   `admin can select all` policies (and the admin write policies) to `authenticated`, using
   `public.is_admin()` instead of inline `users` subqueries. Keep the `public can select active`
   policies. Verify with anonymous GETs (expect 200) and the existing `supabase/verification` style.
3. **Deactivate or hide the QA test product** via the admin UI, with founder approval. It's a data
   change.
4. **One public catalogue read path:** make every public catalogue read use the cookie-less public
   client, and keep the SSR client for seller/admin/user-specific reads.
5. **Make failures visible:** helpers return a typed `{ ok, data, error }` (like
   `getActiveBrandsDetail` already does). Callers render an honest empty or error state in
   production. Demo fallback only behind an explicit dev flag.
6. **Migrate the readers in order:** shop → PDP → brands/brand page → categories → search API +
   search bar → discovery menu → Brand Spotlight → sitemap → AI assistant/stylist context →
   community tagged products. Generate static params from Supabase (or render dynamically).
7. **Then QA (Phase 1E):** anonymous and signed-in passes over every surface, the production-like
   build, and the sitemap/JSON-LD contents.

## Could not be verified

- **Production environment values and Vercel settings:** the Vercel account isn't accessible here.
- **Signed-in behaviour per page:** not exercised. The mechanism is proven via grants.
- **The PDP brand/category degradation in a running page:** established from code (§4), but not
  reproduced in a browser.
- **Who created the two drift policies, and when:** not recorded in the migration history.

---

## Addendum — Phase 1B resolution status (2026-10-01)

*The findings above are the historical Phase 1A record and are left unchanged. This
addendum records what Phase 1B changed; the current design is in
`docs/engineering/DATA_ARCHITECTURE.md`.*

| Finding | Status |
|---|---|
| §8 `permission denied for table users` (brands/categories) | **Fix written, NOT yet applied:** `supabase/migrations/0019_fix_brand_category_public_reads.sql`. Validated against the live project in a rolled-back transaction: anon brands 11 / categories 6, anon still denied on users, admin unchanged. Needs founder approval to apply |
| Live schema drift (two untracked `… active public select` policies) | Recorded in 0019 (dropped as exact duplicates of the tracked policies). Untracked 0001–0016 history and the missing live `saved_items` table (0007 never applied) remain open |
| F1–F8 / F9b silent production fallbacks | **Removed in code.** Every public reader uses `lib/catalog/public-catalog.ts`; errors become 5xx/503/hidden sections, never demo data. Demo only behind `isDemoCatalogueEnabled()` (impossible in production) |
| F10 hard-wired demo surfaces | **Migrated:** discovery menu (live brands; category links only to live categories), Brand Spotlight, Signal Room tiles, AI assistant and the buyer AI engines. Remaining exceptions are listed in DATA_ARCHITECTURE.md |
| Demo static params / demo JSON-LD | **Fixed:** static params from live slugs; JSON-LD only for resolved live entities |
| QA product `skxnz-qa-test-approval-01-bd37e28c` | **Open, awaiting approval:** proposed reversible `status ACTIVE → ARCHIVED` |
| Production `/shop` showing demo | Fixed in code. Takes effect only after 0019 is applied **and** this branch is deployed |

### Execution record — founder-approved production changes (2026-10-01)

- **0019 applied** at 14:08 UTC via Supabase `apply_migration` (only this SQL; history row
  `20261001140816 0019_fix_brand_category_public_reads`). No `db push`, no catch-up of
  0001–0016, `saved_items` untouched. Verified:
  - Policies: exactly `public can select active` (PUBLIC) and `admin can select all`
    (authenticated, `is_admin()`) per table.
  - Role tests: anon 11 brands / 6 categories, users 42501; non-admin 11/6 with
    `is_admin` = false; admin 11/6 with `is_admin` = true.
  - Anonymous REST: brands 200 (11), categories 200 (6), users 401/42501.
  - No new security advisor findings.
- **QA product archived** at 14:15 UTC: guarded update, `RETURNING` exactly 1 row, ACTIVE →
  ARCHIVED. The row and its 8 variants are kept. Undo with `status = 'ACTIVE'`.
  - Public removal verified: sitemap, shop, search, AI assistant, product route (404). The
    homepage, `/categories/jackets` and `/brands/apex` cleared after one 5-minute ISR window.
  - Live catalogue now has 6 ACTIVE products.
