# SKXNZ Day 2 — Live Catalog Sprint Report & Execution Plan

**Date:** 2026-07-06
**Branch:** `day2-live-data-clean`
**Mission:** Buyer Live-Data Coverage
**Status at time of writing:** D2-1 through D2-3 committed. Codex executing D2-4 (product detail live data) in parallel — no code files edited while it runs.

---

## 1. Work Completed Today

| Slice | Commit | Scope |
|---|---|---|
| D2-1 | `5de3ed5` feat(home): use live catalog sections | Homepage product rows (Trending / New In / Luxury Finds) + top brand strip fetch live Supabase data server-side; static demo content retained as honest fallback |
| D2-2 | `d5c7fce` feat(catalog): connect brand pages to live data | `/brands` index and `/brands/[slug]` detail live-first; new queries `getActiveBrandBySlug`, `getActiveProductsByBrandId`; new mapper `mapBrandToDemoBrand` |
| D2-3 | `b073bd1` feat(catalog): connect category pages to live data | `/categories/[slug]` live-first; new queries `getActiveCategoryBySlug`, `getActiveProductsByCategoryId`; new mapper `mapCategoryToStructuredCategory`; demo-wording removed on live path |
| D2-4 | in progress (Codex) | `/product/[id]` live product detail |

All slices: no SQL run, no push, RLS-enforced anon client only, no secrets in client code, ACTIVE-only product filters throughout.

---

## 2. Live Catalog Architecture Status

**Live-first (DB wins, demo fallback only when live empty/failed):**
- Homepage sections + brand strip
- `/brands` index
- `/brands/[slug]` detail (ACTIVE products, real product counts)
- `/categories/[slug]` detail (ACTIVE products, real counts, honest filter copy)

**Inverted priority (needs correction in D2-5):**
- `/product/[id]` — server resolves live product correctly, but the client shell (`components/buyer/product-detail-shell.tsx:86`) prefers the browser-local demo marketplace catalog over the live-resolved product: `getProductById(productId) ?? seedProduct`.

**Still fully demo:**
- Search
- Wishlist / cart persistence
- "Similar brands" / "Similar categories" strips on live pages (demo-sourced, honest but visually inconsistent)

**Routing inconsistency:**
- Brands and categories route by slug; product detail routes by id (UUID for live rows). `getProductBySlug()` exists in `lib/catalog/queries.ts` but is unused.

---

## 3. Known Bugs Found by QA

| # | Severity | Bug | Location |
|---|---|---|---|
| 1 | High | Homepage product cards hardcode `href: "/shop"` — never deep-link to product detail | `lib/catalog/mappers.ts` → `mapProductToHomeProduct()` |
| 2 | High | Product detail client shell lets local demo catalog shadow the live-resolved product | `components/buyer/product-detail-shell.tsx:86` |
| 3 | Medium | No null-safety on `price_inr`, `stock_quantity`, `sort_order` in mappers — NaN prices / broken image order / thrown reduce if DB allows null | `lib/catalog/mappers.ts` |
| 4 | Medium | `product.tags` spread directly — throws if column returns `null` instead of `[]` | `lib/catalog/mappers.ts` → `mapCatalogProductToBuyerProduct()` |
| 5 | Low | Live categories carry `dataSource: "sheet"` (type constraint); misclassification trap if any component ever branches on it | `lib/catalog/mappers.ts` → `mapCategoryToStructuredCategory()` |
| 6 | Low | "Similar brands"/"similar categories" strips on live pages still demo-sourced | brand/category shells |

Inactive-product leakage: audited, **not found** — all query paths filter `status = "ACTIVE"` and variant `is_active = true` correctly.

---

## 4. Checks to Run After Codex Finishes D2-4

Run in order; all against real Supabase data:

1. `git log --oneline -5` — confirm D2-4 commit landed, note hash.
2. `git status --short` — working tree clean, no stray files.
3. Secret scan: `rg -n "service_role|SUPABASE_SECRET_KEY|access_token|refresh_token" app/product components/buyer lib/catalog`
4. `pnpm exec tsc --noEmit` — only pre-existing `lib/prisma.ts` PrismaClient error is acceptable.
5. Route walk:
   - `/` — product cards render live data; click a card (expect bug #1 until D2-5).
   - `/brands` — live brands, real counts, no "Demo profile" badge on live cards.
   - `/brands/[live-slug]` — live identity, ACTIVE products only, no cross-brand leakage.
   - `/categories/[live-slug]` — live copy ("live SKXNZ catalog products"), counts match real ACTIVE list.
   - `/product/[live-id]` — price not NaN, gallery ordered by `sort_order`, real sizes/colors (not "One Size"/"Default" when variants exist), verify local catalog does not shadow live product.
   - Fallback routes (`/categories/women`, `/brands/[demo-slug]`, `/product/[seed-id]`) — zero regression, demo copy intact.
6. Server console — `[catalog] ... failed` warnings acceptable only if genuinely offline; none expected in production env.

---

## 5. D2-5 — Fix Pass Plan

**Scope:** `lib/catalog/mappers.ts`, `components/buyer/product-detail-shell.tsx` only.

1. Fix `mapProductToHomeProduct` href: `"/shop"` → `/product/${product.id}` (bug #1).
2. Invert product-detail priority: live-resolved server product wins; local marketplace context only used for demo/seed ids (bug #2). Must not break the seller-submitted-product preview path (approved local products still open on the same route).
3. Add defensive coalescing for `price_inr ?? 0`, `stock_quantity ?? 0`, `sort_order ?? 0`, `tags ?? []` in mappers (bugs #3–4). No speculative validation beyond that.
4. Checks: tsc, secret scan, homepage card click-through, live + demo product routes.
5. Commit: `fix(catalog): product card links and live detail priority`

---

## 6. D2-6 — Live Search Plan

**Scope:** search route/components + `lib/catalog/queries.ts`, `lib/catalog/mappers.ts` if needed.

1. Locate current search implementation (client-side against local/demo catalog via `useMarketplace()`).
2. Add one server helper (only if existing ones don't fit): ACTIVE-only product search by name/tag/brand-name term, following the established defensive query pattern.
3. Reuse `mapCatalogProductToBuyerProduct` for result shaping.
4. Live-first with honest fallback: if query fails or empty, existing local search behavior remains.
5. No fake result counts, no fake trending searches.
6. Commit: `feat(search): connect buyer search to live catalog`

---

## 7. Tomorrow Sprint Plan (Day 3)

Ranked by value and dependency order:

| Priority | Task | Depends on |
|---|---|---|
| 1 | D2-5 fix pass (broken click-through is a core-flow blocker) | D2-4 committed |
| 2 | D2-6 live search | D2-5 (stable product links) |
| 3 | D2-7 catalog identity cleanup — decide canonical product URL (recommend `/product/[slug]` via unused `getProductBySlug`, keep `/product/[id]` working), audit all internal product links | D2-5 |
| 4 | Runtime QA sweep against real Supabase rows (Section 4 checklist end-to-end) | 1–3 |
| Deferred | Wishlist/cart auth persistence, checkout foundation — blocked until product identity (item 3) is settled | D2-7 |
| Out of scope | Admin/seller approval changes, delivery integration | — |

---

## 8. End-of-Day Report Template

```markdown
# SKXNZ EOD Report — [DATE]

**Branch:** [branch]
**Commits today:** [hash — message, one per line]

## Shipped
- [slice ID — one-line outcome]

## Live data coverage
- Live-first routes: [list]
- Demo-only remaining: [list]

## Bugs found / fixed
- [ID — status: open/fixed — one line]

## Checks run
- tsc: [pass / pre-existing errors only]
- Secret scan: [clean/findings]
- Route walk: [routes tested — pass/fail]

## Blocked / risks
- [item — what unblocks it]

## Tomorrow first task
- [single next action]

Confirm: no SQL run ▢ · no push ▢ · PROGRESS.md updated ▢
```

---

*No app/, components/, lib/, middleware, migration, or package files were modified for this report. No SQL run. No commit made.*
