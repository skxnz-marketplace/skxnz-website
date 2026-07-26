# SKXNZ Live Catalog — Runtime QA Playbook

**Branch:** `day2-live-data-clean`
**Applies to:** D2-1 → D2-4 (homepage, brands, categories, product detail live data)
**Prerequisite:** Codex has committed D2-4. Do not start until its commit is visible in `git log`.

---

## 1. Exact Testing Order

Run steps in this order. Stop and file a bug (Section 9) at the first High-severity failure; continue through Medium/Low.

1. **Static checks (no browser):**
   ```
   git log --oneline -6          # D2-4 commit present, note hash
   git status --short            # tree clean
   rg -n "service_role|SUPABASE_SECRET_KEY|access_token|refresh_token" app/product components/buyer lib/catalog
   pnpm exec tsc --noEmit        # only pre-existing lib/prisma.ts error allowed
   ```
2. **Start dev server** (`pnpm dev`), keep the terminal visible for `[catalog]` warnings the whole session.
3. **Supabase Table Editor verification** (Section 5) — do this BEFORE route testing so you know what data to expect on screen.
4. **Live routes** in this order: `/` → `/brands` → `/brands/[live-slug]` → `/categories/[live-slug]` → `/product/[live-id]` → `/shop`.
5. **Fallback routes**: demo brand → demo category → demo product.
6. **Screenshots** (Section 3) as you go, not after.
7. **Go/no-go checklist** (Section 10).

---

## 2. Route-by-Route Pass/Fail Checklist

Mark each line PASS / FAIL / N-A.

### `/brands`
- [ ] Live brands render (names match Supabase `brands` rows), not the demo grid
- [ ] Product count badge per brand equals the real ACTIVE product count for that brand
- [ ] No "Demo profile" badge on any live brand card
- [ ] Every brand card links to `/brands/[its-slug]` and the link works
- [ ] Page renders (with demo fallback) even if Supabase unreachable — no crash

### `/brands/[live-brand-slug]`
- [ ] Brand name, description, logo/hero match the Supabase row (or clean placeholder if null)
- [ ] Product grid shows ONLY this brand's ACTIVE products — no cross-brand leakage
- [ ] Product count badge equals visible grid count
- [ ] Category filter dropdown options come from the real products shown
- [ ] Sort options (price low/high, newest) reorder correctly
- [ ] No "Demo brand profile" label on the hero
- [ ] Products stat card equals real ACTIVE count

### `/categories/[live-category-slug]`
- [ ] Category name in hero matches Supabase `categories.name`
- [ ] Filter copy says "live SKXNZ catalog products" — not "demo products"
- [ ] "{n} products" and "{n} total matches" badges equal the real ACTIVE list length
- [ ] Products shown belong ONLY to this category
- [ ] Brand/size/color filter options derive from the real products
- [ ] Empty-state (if zero products) does not mention "local demo catalog data"

### `/product/[live-product-id]`
- [ ] Product name, subtitle, description match Supabase row
- [ ] Price displays correctly — no `NaN`, no `₹0` unless the row truly has 0
- [ ] Gallery images ordered by `product_images.sort_order`
- [ ] Thumbnails and prev/next arrows work if 2+ images
- [ ] Sizes/colors show real variant values — "One Size"/"Default" ONLY if variants genuinely lack size/color
- [ ] Live product is NOT shadowed by a browser-local demo product (hard-refresh + also test in a private window with empty localStorage)
- [ ] "Live Supabase catalog record" appears in features list

### Demo fallback brand route (e.g. `/brands/signal-studio`)
- [ ] Renders exactly as before Day 2 — demo copy, "Demo profile" badge intact
- [ ] No live-data wording appears

### Demo fallback category route (e.g. `/categories/women`)
- [ ] Renders demo catalog products via signal-matching as before
- [ ] "Filter central demo products…" copy intact
- [ ] Not-found state for a garbage slug (e.g. `/categories/zzz-fake`) still shows "Category not found."

### Demo fallback product route (e.g. `/product/[seed-id]`)
- [ ] Seed product opens with full gallery/details as before
- [ ] Garbage id (e.g. `/product/zzz-fake`) shows "Product not found" empty state, no crash

### Homepage product cards (`/`)
- [ ] Trending Now / New In / Luxury Finds show live products (names/prices match DB)
- [ ] Top brand strip shows live brand names/monograms
- [ ] Prices formatted correctly (₹, Indian grouping, no NaN)
- [ ] Card click-through: KNOWN BUG until D2-5 — cards link to `/shop` not product detail. Verify current behavior and note whether D2-4/D2-5 fixed it
- [ ] With empty live catalog: static fallback sections render, page never blank

### `/shop` product cards
- [ ] Live ACTIVE products render in the grid
- [ ] Each card opens its product detail page (click 3 different cards)
- [ ] Filters/URL params still work (brand filter, etc.)

---

## 3. Screenshots to Capture

Save with route + state in the filename.

1. `/` full page — live sections visible
2. `/brands` — live grid with count badges
3. `/brands/[live-slug]` — hero + product grid in one shot
4. `/categories/[live-slug]` — hero + filter card showing the "live" copy + count badges
5. `/product/[live-id]` — full detail: price, sizes, gallery thumbnails
6. `/product/[live-id]` — second shot after clicking a different gallery thumbnail (proves ordering/switching)
7. One demo fallback route (brand or category) — proves no regression
8. Any FAILED state — always screenshot before touching anything

---

## 4. Console / Network Errors to Watch

**Server terminal (dev server):**
- `[catalog] ... failed:` warnings — acceptable ONLY if Supabase is genuinely unreachable; on a working connection each one is a FAIL
- `TypeError: fetch failed` — connectivity, not code; note but don't file as code bug
- Any unhandled promise rejection or stack trace — automatic FAIL

**Browser console (F12 → Console):**
- Red errors of any kind — FAIL
- `Warning: Each child in a list should have a unique "key"` — file as Low
- Hydration mismatch warnings ("Text content does not match server-rendered HTML") — file as Medium; likely live/local data disagreement in product detail

**Browser Network tab:**
- Requests to `*.supabase.co/rest/v1/*` return 200 (401/403 = RLS/anon-key problem — High)
- No request carries a `service_role` key (check request headers on one Supabase call — `apikey` must be the anon key)
- No 404s on product/brand/category images beyond expected placeholder fallbacks

---

## 5. Supabase Data Fields to Verify in Table Editor (no SQL)

Open each table in the Dashboard Table Editor and eyeball:

**`brands`** — at least 1 row with `is_active = true`; that row has non-empty `slug` and `name`; note the slug for route tests.

**`categories`** — at least 1 row with `is_active = true`; non-empty `slug`, `name`; `sort_order` not null; note the slug.

**`products`** — at least 1 row with `status` exactly `ACTIVE` (uppercase — sort the status column to spot case drift like `active`); that row has non-null `price_inr` and non-empty `slug`/`name`; `tags` shows `[]` not empty/NULL; note the `id` (UUID) for the product route test; check `brand_id`/`category_id` point at the active brand/category above.

**`product_variants`** — rows for the test product with `is_active = true`; `stock_quantity` not null; at least one with a real `size` or `color` so the fallback labels can be distinguished from real data.

**`product_images`** — 2+ rows for the test product with distinct `sort_order` values (proves gallery ordering) and reachable `url`s (paste one in a browser tab).

Also confirm every table above shows the RLS shield icon enabled.

---

## 6. Confirming ACTIVE-Only Filtering

1. In Table Editor, find (or temporarily create via editor UI, then revert) a product with `status = PENDING_REVIEW` or `REJECTED` under the live brand/category.
2. Load `/brands/[live-slug]`, `/categories/[live-slug]`, `/shop`, `/` — the non-ACTIVE product must NOT appear anywhere.
3. Open `/product/[non-active-id]` directly — must show "Product not found", never the product.
4. In Table Editor, set one variant of the live product to `is_active = false` — its size/color must vanish from the product page after refresh (revert afterwards).
5. Set the live brand `is_active = false` briefly — `/brands/[slug]` must fall back to demo/not-found, not render the brand (revert afterwards).

---

## 7. Confirming No Demo Wording Leaks on Live Routes

On each LIVE route, Ctrl+F the rendered page for these strings — all must be ABSENT:

- "Demo profile"
- "Demo brand profile"
- "demo products"
- "local demo catalog"
- "browser-local"
- "No official partnership" (acceptable on `/brands` index hero if it still describes demo entries shown alongside — FAIL only if the page shows exclusively live brands)

Then on each DEMO fallback route, confirm the demo wording IS still present (honesty preserved both directions).

---

## 8. Confirming Product Image / Variant / Price Mapping

Using the test product noted in Section 5:

**Images:** count rows in `product_images` for the product; gallery thumbnail count must match; first large image must be the row with the LOWEST `sort_order`; swap two `sort_order` values in Table Editor, refresh, confirm order flips (revert).

**Variants:** list distinct non-null sizes and colors from `product_variants` (active only); page must show exactly those sets; sum of `stock_quantity` across active variants = expected stock (verify anywhere stock is displayed).

**Price:** `price_inr` is whole rupees. Page must show `₹{price_inr}` with Indian digit grouping (e.g. `price_inr = 4299` → `₹4,299`). If `compare_at_price_inr` set, struck-through old price shows on homepage cards. Any `₹NaN`, `₹0` mismatch, or a 100× discrepancy (paise/rupee confusion) = High FAIL.

---

## 9. Bug Report Format

One block per failure. File in chat or the day's report — no code edits during QA.

```markdown
### BUG-[n]: [one-line summary]
- Severity: High / Medium / Low
- Route: [exact URL tested]
- Data: [table + row id/slug used]
- Expected: [what should render, per this playbook section #]
- Actual: [what rendered — attach screenshot filename]
- Console/network: [exact error line, or "clean"]
- Reproducible: [always / intermittent / once]
- Suspected file: [file:line if known, else "unknown"]
```

Severity guide: High = wrong/missing data shown to buyer, crash, security; Medium = degraded UX, hydration mismatch, wrong copy; Low = cosmetic, keys warning.

---

## 10. Final Go / No-Go Checklist — Ending Day 2

All must be YES to close the day:

- [ ] D2-4 commit in `git log`; working tree clean
- [ ] Secret scan clean on all touched paths
- [ ] `tsc --noEmit` — only the pre-existing `lib/prisma.ts` error
- [ ] All 4 live routes PASS (Section 2)
- [ ] All 3 demo fallback routes PASS — zero regression
- [ ] ACTIVE-only filtering confirmed (Section 6)
- [ ] No demo wording on live routes; demo wording intact on demo routes (Section 7)
- [ ] Image/variant/price mapping verified against Table Editor (Section 8)
- [ ] No unexplained server warnings or browser console errors
- [ ] All Table Editor temporary changes reverted
- [ ] Open bugs filed in Section 9 format and listed in the day's report
- [ ] Known-open items acknowledged: homepage card href bug (D2-5), product detail local-shadow priority (D2-5), search still demo (D2-6)
- [ ] PROGRESS.md updated (after Codex finishes — single combined update for D2-1→D2-4)
- [ ] No SQL run, no push, commits only via the agreed slice commits

**No-go triggers:** any High bug on a live route, any demo-route regression, any secret found in client code, or non-ACTIVE product visible to buyers. Do not end the day green with any of these open.

---

*This playbook is documentation only. No app code, migrations, middleware, package files, or PROGRESS.md were modified. No SQL run. No commit. No push.*
