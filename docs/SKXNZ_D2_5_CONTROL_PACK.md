# SKXNZ D2-5 Control Pack — Product Link + Live Priority Fix Pass

**Branch:** `day2-live-data-clean`
**Precondition:** D2-4 committed by Codex and accepted per Section 1.
**Companion docs:** `SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`, `SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md`

---

## 1. D2-4 Acceptance Checklist

Do NOT start D2-5 until Codex's D2-4 report proves ALL of the following:

- [ ] Commit hash stated and visible in `git log --oneline -6`
- [ ] Files changed listed explicitly; all within product-detail scope (`app/product/[id]/page.tsx`, `components/buyer/product-detail-shell.tsx`, `lib/catalog/queries.ts`, `lib/catalog/mappers.ts` only)
- [ ] `/product/[live-id]` confirmed to resolve a live Supabase ACTIVE product server-side
- [ ] Non-ACTIVE product id confirmed to show not-found, never the product
- [ ] Demo/seed product route confirmed unregressed (`/product/[seed-id]` opens as before)
- [ ] Seller-submitted local product preview confirmed still working on the same route
- [ ] Secret scan on touched files reported clean
- [ ] `tsc --noEmit` reported — only the pre-existing `lib/prisma.ts` PrismaClient error
- [ ] Explicit "no SQL run, no push" confirmation
- [ ] Report states whether Codex already changed the `getProductById(productId) ?? seedProduct` priority in the shell, and whether homepage card hrefs were touched

**Last two items decide D2-5 scope:** if Codex already fixed either bug, strike it from the brief below and say so in the D2-5 report. Do not redo or revert Codex's version.

---

## 2. D2-5 Implementation Brief (exact scope)

### Fix 1 — Homepage product cards must link to product detail
`lib/catalog/mappers.ts` → `mapProductToHomeProduct()` currently returns `href: "/shop"` for every card.
Change to `href: \`/product/${product.id}\``.
That is the whole fix. Trending Now / New In / Luxury Finds cards then deep-link correctly; `components/home/product-row.tsx` already renders `product.href` on both the image link and preview link — do not touch it.

### Fix 2 — Product detail must prefer live server product
`components/buyer/product-detail-shell.tsx:86` currently:
```ts
const product = getProductById(productId) ?? seedProduct;
```
Local browser marketplace catalog shadows the live-resolved server product. Invert priority so the server-resolved product (`seedProduct` prop — it is the live product when the id exists in Supabase, else the seed product) wins, and the local marketplace context is the fallback:
```ts
const product = seedProduct ?? getProductById(productId);
```
**Preservation requirement:** seller-submitted products that exist ONLY in local marketplace state (not in Supabase, not in seed data) must still open. With the inverted order they do — `seedProduct` is `null` for them, so the local lookup still runs. Verify this path explicitly; if any local-only preview flow breaks, report it instead of adding complexity.

### Fix 3 — Defensive null-safety (minimal, only where clearly needed)
In `lib/catalog/mappers.ts` → `mapCatalogProductToBuyerProduct()` and `mapProductToHomeProduct()`:
- `product.price_inr ?? 0` before any `* 100`
- `variant.stock_quantity ?? 0` inside the stock reduce
- `(image.sort_order ?? 0)` in the gallery sort comparator
- `product.tags ?? []` before any spread/filter

Nothing else. No zod, no runtime validation layer, no speculative guards.

### Explicitly out of scope
- No UI redesign, no style changes
- No `/product/[slug]` route work (that is D2-7)
- No search changes (D2-6)
- No changes to how the marketplace provider stores local products

**Commit message:** `fix(catalog): product card links and live detail priority`

---

## 3. Files Codex MAY Touch in D2-5

- `lib/catalog/mappers.ts` (Fix 1 + Fix 3)
- `components/buyer/product-detail-shell.tsx` (Fix 2)
- `app/product/[id]/page.tsx` — only if a prop/type adjustment is strictly forced by Fix 2; prefer zero changes

No other file. If a fix appears to require touching anything else, stop and report instead.

---

## 4. Files Codex MUST NOT Touch

- `supabase/migrations/**` — no schema changes ever in a fix pass
- `middleware.ts` / any middleware
- `app/api/**` (payments, webhooks, auth routes)
- Anything under `app/admin/**`, `app/seller/**`, `app/account/**`, auth pages
- Checkout / cart / order / wishlist code
- `components/marketplace/marketplace-provider.tsx` — local catalog behavior stays as-is
- `lib/supabase/**`, `lib/prisma.ts`
- `package.json`, lockfiles, config files
- `PROGRESS.md` (updated once, separately, after the slice is accepted)
- Homepage/brand/category pages and shells (D2-1→D2-3 files) — the mapper change in `lib/catalog/mappers.ts` is the only shared surface allowed

---

## 5. Test Command Pack

Run all after implementation, before commit:

```
git status --short
git diff --name-only
rg -n "service_role|SUPABASE_SECRET_KEY|access_token|refresh_token" lib/catalog/mappers.ts components/buyer/product-detail-shell.tsx "app/product/[id]/page.tsx"
pnpm exec tsc --noEmit
```

Pass criteria:
- `git diff --name-only` shows ONLY files from Section 3
- Secret grep: zero hits
- tsc: only pre-existing `lib/prisma.ts(1,10): error TS2305` allowed

Browser route list (dev server running):

```
/
/shop
/product/[live-product-id]      (from Supabase Table Editor)
/product/[seed-product-id]      (from lib/data/products.ts)
/product/zzz-nonexistent
/brands/[live-brand-slug]       (regression spot-check only)
/categories/[live-category-slug] (regression spot-check only)
```

---

## 6. Manual Runtime QA Pack

Exact order. Screenshot each numbered step.

1. **`/` homepage** — hover a Trending Now card: browser status bar must show `/product/[id]`, not `/shop`. Click it. Must land on that product's detail page with matching name/price. Repeat for one New In and one Luxury Finds card.
2. **`/product/[live-id]` fresh load** — hard refresh (Ctrl+Shift+R). Live data renders: correct price (no NaN), gallery ordered, real variant sizes/colors.
3. **Same route, private/incognito window** (empty localStorage) — identical render. Proves live product no longer depends on or is shadowed by local state.
4. **Local-shadow test** — in the normal window (with hydrated local marketplace state), reload the live product. Name/price must match Supabase, not any local demo item.
5. **`/product/[seed-id]`** — seed product opens exactly as before D2-5.
6. **Seller-submitted local-only product** — if one exists in local state from Day 1 testing, open its detail route; must still render. If none exists, note "not testable this session" in the report — do not fabricate a pass.
7. **`/product/zzz-nonexistent`** — "Product not found" empty state, no crash.
8. **`/shop`** — click 2 product cards; both open correct detail pages (pre-existing behavior, regression check).
9. **`/brands/[live-slug]` and `/categories/[live-slug]`** — quick visual check that the shared mapper change broke nothing: counts, prices, product grids all still correct.
10. **Server terminal + browser console** — no new errors introduced at any step above.

---

## 7. D2-5 Final Report Template

```markdown
# D2-5 Report — Product Card Links + Live Detail Priority

**Commit:** [hash] fix(catalog): product card links and live detail priority
**Files changed:** [exact list — must be a subset of Section 3]

## Before / After
- Fix 1 (card links): before — homepage cards href "/shop"; after — [confirmed /product/{id}, tested cards listed]
- Fix 2 (live priority): before — local marketplace product shadowed live server product; after — [order now used, seller local-only path status]
- Fix 3 (null-safety): [exact coalescing added, or "field already safe — skipped" per field]
- Pre-completed by D2-4: [none / list any fix Codex had already made that was skipped here]

## Checks
- git diff --name-only: [output]
- Secret grep: [clean/hits]
- tsc --noEmit: [only pre-existing lib/prisma.ts error / other]
- Runtime QA: [step numbers from Section 6 with pass/fail; screenshots attached]

## Known limitations
- [e.g. seller local-only product untestable this session; /product/[slug] canonical route deferred to D2-7]

## Confirmations
- No SQL run: YES
- No push: YES
- No files outside allowed list: YES
- PROGRESS.md: not touched (pending combined Day 2 update)
```

---

*This control pack is documentation only. No app code, migrations, middleware, package files, or PROGRESS.md modified. No SQL. No commit. No push.*
