# SKXNZ LAUNCH WAR — DAY 10-C: BUYER FIRST-IMPRESSION RECOVERY

Date: 2026-07-21
Branch: `claude/d10c-buyer-recovery` (worktree, base `e1a1d75`)
Scope: buyer-facing UI only. No payment, Supabase, migration, backend, seller, admin, checkout-flow, build-script, or environment change.

## What was fixed (mapped to D10-B evidence)

### 1. Homepage tells the truth (P1)
- Deleted the fabricated fallback product lists (VANTA/AXIS/HALO/…) and the fabricated brand rail from [lib/home-data.ts](../lib/home-data.ts). `brandLabels` now lists only real curated labels.
- [app/page.tsx](../app/page.tsx) still prefers the live Supabase catalog; its fallback is now the same approved local catalogue the shop grid renders, mapped through `getProductHref` so **every card links to a real product page**. Sections with no products render nothing instead of inventing cards.
- Runtime proof: homepage now serves 12 unique `/product/...` links (was 0) and zero fabricated product names.

### 2. Product imagery on homepage cards (P1)
- [components/home/product-row.tsx](../components/home/product-row.tsx) now renders the product image via `SafeImage` (fallback: branded product placeholder) instead of an empty gradient tile. Runtime proof: 30 rendered images on `/`, 0 broken (was 2 images total, both logos).
- Removed the inflated "+18" brands badge from [components/home/featured-labels.tsx](../components/home/featured-labels.tsx).

### 3. Demo/internal wording purged from buyer surfaces (P1)
- "Demo Atelier" renamed to **Atelier Nova** across buyer-visible data (brand entry, product name/brand, search index, brand heroes, metrics labels, seed order copy). Slug `demo-atelier` unchanged so routes stay stable.
- Brand taglines/descriptions/availability notes rewritten without "demo/testing" framing; brand `status` label now "Curated Preview"; brand-page "Logo type"/"Country" rows no longer read "SKXNZ-safe demo logo" / "Demo marketplace".
- Product descriptions cleaned (layered shirt, chrome bracelet, long coat, crossbody bag) — no "demo … testing" copy.
- `/shop` brand rail: "Explore the curated demo brand stack" → "Explore the curated brand stack"; internal-analysis sentence removed from the Top Brands toolbar.

### 4. AI Stylist buyer gate (P1)
- New [components/ai/stylist-access-gate.tsx](../components/ai/stylist-access-gate.tsx) replaces `DemoRoleGate` on the buyer stylist page only. No internal roles, no "DEMO ACCESS REQUIRED", no "Checking saved demo role." Visitors see a truthful early-access panel with **Enter Guest Preview**, **Sign In**, and **Browse the Catalogue**; signed-in users and existing preview sessions pass straight through. Verified in-browser: guest preview opens the studio.
- Internal `DemoRoleGate` untouched for admin/seller areas.

### 5. Metadata (P3)
- Removed re-appended suffixes that produced "… | SKXNZ | SKXNZ" on checkout, checkout status, orders, order detail, returns, support (layout template `%s | SKXNZ` now does the branding once).
- Added missing titles: Shop the Catalogue, Your Cart, Brands, FAQ, AI Stylist.
- Admin/seller titles left as-is (out of D10-C scope).

### 6. Mobile typography (P2)
- Homepage product-card brand label and image caption raised from 0.58rem (~9px) to 0.64rem; featured-label name raised from 0.42rem to 0.5rem. Sub-10px text elements on `/` at 390px dropped from ~30 to 8. No layout redesign; no horizontal overflow introduced (390px scrollWidth = 390).

## Validation
- `pnpm run test:commerce` — **129 tests, 129 pass, 0 fail** (5 new D10-C source-check tests: no fabricated fallback, no +N badge, role-free stylist gate, demo-free brand/product data, clean titles).
- `tsc --noEmit --incremental false` — clean.
- Targeted ESLint on all changed source files — clean.
- `git diff --check` — clean.
- Runtime spot-check on `http://localhost:3003` (dev server from this worktree; `.env.local` copied from main repo, values never opened): home, shop, PDP, ai-stylist, titles verified; no console errors. Browser screenshot tooling unavailable in this environment (times out), so proof is DOM/text-based.

## Remaining buyer debt (Day 10-D candidates)
- `/shop` price-filter bands still in $ vs ₹ prices.
- Shop grid/PDP card visual quality relies on existing demo asset files; real photography still the end goal.
- Sub-10px micro-copy remains on some non-home routes (~27 elements on `/shop`).
- `demo-atelier` slug still visible in the URL for the Atelier Nova brand/product (rename would require redirects — deliberate deferral).
