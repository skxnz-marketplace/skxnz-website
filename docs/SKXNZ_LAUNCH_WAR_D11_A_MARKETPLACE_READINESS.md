# SKXNZ Launch War — Day 11-A: Real Catalog & Marketplace Readiness

- **Worktree:** `skxnz-claude-d11a-marketplace-readiness`
- **Branch:** `claude/d11a-marketplace-readiness`
- **Base:** `6532a4c` (matches expected HEAD)
- **Scope:** buyer-facing UI only. No backend, no Supabase schema work, no migrations, no payment/seller/admin changes.

---

## 1. Catalog consistency audit

Every buyer surface was traced back to its data source to confirm no product or
brand is invented anywhere.

| Surface | Source | Verdict |
| --- | --- | --- |
| Homepage `Trending Now` / `Luxury Finds` | `getActiveProducts()` (live) with the approved local catalogue as fallback, both mapped in `app/page.tsx` | Real. Every card href comes from `getProductHref()` / the product slug, so it resolves to a real PDP. |
| Homepage `Top Brands` | `getActiveBrands()` mapped to `BrandLabel`, static `brandLabels` fallback | Real. No inflated "+N more" badge. |
| Shop grid | `getActiveProductsWithRelations()` → `mapCatalogProductToBuyerProduct`, approved local catalogue fallback | Real. 15 products / 4 brands rendered in QA. |
| Brands index | `getActiveBrands()` + real ACTIVE product counts, `demoBrands` fallback | Real. `productCount` always comes from a real query — never invented. |
| Brand page | `getActiveBrandBySlug()` + `getActiveProductsByBrandId()` | Real. |
| PDP | slug lookup then id lookup, local seed fallback | Real. |
| Wishlist | Locally stored snapshots of products the buyer actually saved | Real. |
| PDP similar products | **Changed this session** — see below | Now source-consistent. |

### Fix: live PDPs no longer mix in local preview products

`ProductDetailShell` scored "similar products" only against `approvedProducts`
(the browser-local catalogue). A live Supabase product therefore recommended
local preview products, which is a data-source inconsistency a buyer can see.

`app/product/[id]/page.tsx` now resolves live related products server-side
(`resolveLiveSimilarProducts`): same-category live ACTIVE products first, then
the newest remaining actives, capped at 3, behind the same 2.5s timeout the
main product lookup uses. `ProductDetailShell` takes them as `liveSimilarProducts`
and uses them **only** when `product.dataSource === "live"`. Preview products keep
the existing scored local suggestions. If neither yields anything, the whole
"Similar Products" section is now omitted rather than rendering an empty grid
under a heading.

---

## 2. Product media

- **Broken image requests eliminated.** `components/home/shop-split.tsx` layered a
  `.jpg` on top of a `.svg` for both panels as a "drop the photo in later"
  convention. Neither jpg exists, so every homepage load fired two
  `404 Not Found` requests (`/assets/home/shop-men.jpg`,
  `/assets/home/shop-women.jpg`). The jpg layers were removed; the shipped SVG
  backdrops render as designed. Verified: homepage now loads with zero 404s.
- **Full asset sweep.** Every `/assets/...` string literal referenced from
  `src/`, `lib/`, `components/`, and `app/` was checked against `public/`. After
  the shop-split fix, all referenced assets resolve. (Two apparent misses,
  `/assets/products/demo/electric-cy` and `/assets/products/demo/sonic-ma`, are
  false positives from deliberately split string concatenations in
  `src/lib/assets.ts`; the concatenated paths exist.)
- **No stretching / consistent ratios were already correct** and were left alone:
  `SafeImage` renders every product image with `fill` + `object-cover
  object-center` inside a fixed-ratio container (`aspect-[3/4]` home cards,
  `h-44/h-48` shop cards, `aspect-[4/3]` wishlist cards).
- **Loading + failure behaviour already sound:** `SafeImage` classifies the src,
  marks remote URLs `unoptimized` (no `images.remotePatterns` configured), falls
  back to a local asset on error, then to a styled gradient block with
  `role="img"` — so a bad seller URL can never crash the page or show a broken
  image icon. PDP hero uses `priority`; all others carry explicit `sizes`.

---

## 3. Catalog experience

- **PDP related-products section is now conditional** (see §1) instead of
  rendering a heading over an empty grid.
- **Brand page "From ₹…" badge was wrong.** It computed `Math.min` over
  `product.price`, ignoring `salePrice`, so it advertised a higher price than the
  cards below it showed (`FROM ₹3,299` above a `₹2,899` card). Now uses
  `salePrice ?? price`, matching the displayed price.
- **Pluralisation.** Brand cards and the brand-page count badge rendered
  `1 PRODUCTS`. Both now switch to `product` at count 1.
- Empty / no-results states were audited and left as-is — they are already
  truthful and specific (`No signal found.` for search, `No products match this
  filter mix.` for filters, `No approved <brand> products yet.` for brands, cart
  and wishlist empties each name the real limitation).

---

## 4. Filter audit

**Removed one fake filter.** The homepage `ShopSplit` panels linked to
`/shop?gender=men` and `/shop?gender=women`. `/shop` reads only `brand` and `q`
— the `gender` param was silently discarded, and there is no gender column on
products anywhere in the catalog data. Two of the most prominent homepage CTAs
therefore promised a filter that does not exist.

Rather than invent gender data, the panels now point at the two real browse
surfaces: **Shop New Drops → `/shop`** and **Explore The Brands → `/brands`**.
The section label changed from "Shop by department" to "Shop the catalogue and
brands" to stay truthful.

**Fixed the price filter.** `ShopBrowser`'s price bands were dollar ranges
(`Under $150`, `$150-$250`, `$250-$350`, `$350+`) compared against
`product.price`, which is **whole rupees**. Every catalogue product costs
₹1,499–₹6,999, so *every* product fell into `$350+` and the other three bands
always returned zero results — a filter that appeared to work but could not. Bands
are now rupee ranges matched to the real price spread
(`Under ₹2,000` / `₹2,000-₹3,500` / `₹3,500-₹5,000` / `₹5,000+`), and matching
now uses `salePrice ?? price` so it filters on the price the buyer actually pays.
Verified live: `Under ₹2,000` returns 2 products.

**Kept (all backed by real data):** category, brand, size, colour on `/shop`;
category + sort on brand pages; search/discovery filters on `/brands`. The
unknown-brand escape hatch in `ShopBrowser` (an unresolvable `?brand=` slug shows
`Unknown brand: <slug>` and matches nothing) is correct behaviour and was kept.

---

## 5. Buyer polish

Internal/developer wording removed from buyer-facing surfaces:

| Location | Before | After |
| --- | --- | --- |
| `brands-index-shell.tsx` card badge | `Demo profile` | `Preview profile` |
| `brands-index-shell.tsx` hero copy | "SKXNZ-safe demo brand profiles … no claim is made for demo brands" | "curated brand profiles … no claim is made for preview profiles" |
| `brands-index-shell.tsx` section blurbs | "Ranked from demo catalogue signals", "Newly staged demo profiles", "Streetwear-coded demo routes", "Premium demo brands / Demo profiles only" | "Ranked from current catalogue activity", "Recently added brand profiles", "Streetwear-focused brand profiles", "Premium brands / Preview profiles only" |
| `brand-page-shell.tsx` eyebrow | `Demo brand profile` | `Preview brand profile` |
| `brand-page-shell.tsx` disclosure | "…not claimed by this demo profile" | "…not claimed by this preview profile" |
| `brand-page-shell.tsx` status tile | `Demo/internal` | `Preview` |
| `account-shell.tsx` | `Demo account area.` | `Account preview area.` |
| `brandPageHeroes.ts` (Atelier Nova) | `DEMO ATELIER EDIT` / "Premium demo collection for testing the SKXNZ brand experience." | `ATELIER NOVA EDIT` / "Sculpted premium womenswear curated for the SKXNZ edit." |
| `brandPageHeroes.ts` (Signal Studio) | "Streetwear-inspired demo brand page for SKXNZ marketplace testing." | "Streetwear-coded pieces from the Signal Studio preview catalogue." |
| `brandPageHeroes.ts` (Chrome District) | "Demo accessories page for testing brand discovery and search." | "Chrome-coded accessories and lifestyle pieces for the SKXNZ edit." |
| `brandPageHeroes.ts` hero CTAs | `View Brand` (on the brand's own page, where it jumps to the product grid) | `Shop Products` |

The "no partnership / no authorization claim" disclosures were **kept** — only
the internal word "demo" was replaced. Nothing was upgraded into a claim the
product cannot back.

Audited and found already clean (no change): homepage sections, `/shop` copy,
PDP copy, cart, `/search` (a redirect into `/shop?q=`), `/faq`, `/community`,
`/support`. Their "Beta"/"private preview"/"not live yet" wording is accurate
disclosure aimed at buyers, not leaked internal vocabulary.

---

## 6. Accessibility

- **Removed a fake control.** The homepage `ProductRow` card had a heart button
  with `aria-label="Add to wishlist"` wired to nothing but local `useState` — it
  toggled a red heart and dropped the action on the floor, and did not
  participate in the real wishlist that `/wishlist` reads. Announcing an action
  to assistive tech and then not performing it is worse than not offering it, so
  the button (and its now-unused `HeartIcon`) was removed. The real, working
  `WishlistButton` remains on every shop/brand/PDP card.
- **Wishlist feedback is now announced.** The status message in `WishlistGrid`
  (add-to-cart result, removal confirmation) rendered as a silent `div`; it now
  carries `role="status"` + `aria-live="polite"` so screen-reader users hear the
  outcome of their own action.
- Verified already-correct and left alone: hero carousel arrows/dots have
  labels and honour `prefers-reduced-motion`; inactive slides use `visibility:
  hidden` so they leave the tab order; every `SafeImage` has a real `alt`;
  `ShopBrowser` filters are wrapped in `<label>`; brand page selects have
  `aria-label`; `ShopSplit` panels and `CategoryStrip` tiles have visible
  `focus-visible` outlines; `ProductCard` "View" carries `aria-label="View
  <name>"`; the `PlaceholderBlock` fallback exposes `role="img"` with the alt text.

---

## 7. Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run test:commerce` | **129 pass / 0 fail** |
| `pnpm.cmd exec tsc --noEmit --incremental false` | **EXIT 0** |
| Targeted ESLint (all 10 changed files) | **EXIT 0** |
| `git diff --check` | clean |

The worktree had no `node_modules`; dependencies were made available via a
directory junction to the existing clean worktree's `node_modules` (same
approach used on earlier days). No install was run, no lockfile touched.

---

## 8. Manual browser QA

Dev server run from this worktree; every route below loaded 200 with no console
errors and no failed asset requests.

| Route | Result |
| --- | --- |
| `/` | Hero, categories, top brands, Trending Now (6 real products), Shop The Edit, both split panels, Luxury Finds (4 real products), trust bar. **Zero 404s after the media fix.** |
| `/shop` | 15 real products, 4 real brands, all 5 filters populated from real facets. Price filter exercised live (`Under ₹2,000` → 2 products). |
| `/brands` | 4 real brands, correct counts, corrected pluralisation, no "demo" wording. |
| `/brands/signal-studio` | Correct hero copy, `1 PRODUCT`, `FROM ₹2,899` matching the card. |
| `/product/obsidian-signal-oversized-tee` | Gallery, variants, stock, 3 similar products all resolving to real PDPs. |
| `/wishlist` | Redirects unauthenticated buyers to `/login` (expected — it is an account surface). |
| `/cart` | Truthful empty state, honest checkout-status panel. |
| `/community` | Loads; "Opening soon" framing is accurate. |
| `/faq` | Loads clean. |

Authenticated buyer QA (wishlist grid with saved items, live Supabase catalog
rendering) remains blocked by the standing Supabase-unreachable-from-dev-machine
limitation; the local approved catalogue was exercised instead.

---

## 9. Remaining marketplace debt

1. **Wishlist page is behind auth** but the wishlist store itself is
   `localStorage`-only. A signed-out buyer can save items from a card and then be
   bounced to `/login` when they click the wishlist icon. Either the store should
   move server-side or the page should render the local list for guests.
2. **Live catalog rendering is still unproven end-to-end** — every live path has a
   local fallback, so all QA to date exercises the fallback. Needs one
   Supabase-reachable session to confirm live products, brands, images, and the
   new live similar-products path.
3. **Brand `productCount` on `/brands` counts all ACTIVE products for the brand**,
   while the brand page counts only what passes its own filters. They agree today
   but could diverge.
4. **No gender/department taxonomy exists.** If department browsing is a launch
   requirement, it needs real product data first — this session deliberately
   removed the fake version rather than faking the data.
5. **Category pages (`/categories/*`) were out of scope** for this pass and were
   not audited.
6. **Homepage `mosaicTiles` and `categoryItems` carry empty `image: ""` fields**;
   the components paint gradients/`CATEGORY_IMAGES` instead. Harmless but the dead
   fields invite future confusion.

---

## 10. Guarantees

- Worktree created by Claude at `6532a4c`; no push, no merge, no deployment.
- No SQL executed, no migration added or applied, no Supabase schema change.
- No backend, payment, seller, or admin code touched.
- No secrets added. A local `.env.local` was copied in for the dev server and
  **deleted** before commit; it is untracked and gitignored regardless.
- **No product or brand was fabricated.** Every change either removed something
  untruthful (a filter with no data, a button with no effect, internal wording) or
  made an existing real value display correctly.
