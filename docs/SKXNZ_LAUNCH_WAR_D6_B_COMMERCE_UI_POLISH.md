# SKXNZ LAUNCH WAR — D6-B: Commerce UI Polish + Buyer Route Readiness

Date: 2026-07-15
Owner: Claude (frontend/UI engineer, parallel to Codex D6-A)

## 1. Starting main repo state

- Main worktree: `skxnz-day2-clean`
- Branch: `launch-war-july30`
- HEAD: `a98811b` (`feat(checkout): complete payment readiness experience`)
- Tracked tree clean; known unrelated untracked files present and untouched
  (`.claude/settings.local.json`, `AGENTS.md`, `docs/SKXNZ_D2_5_CONTROL_PACK.md`,
  `docs/SKXNZ_DAY2_LIVE_CATALOG_SPRINT_REPORT.md`,
  `docs/SKXNZ_LIVE_CATALOG_RUNTIME_QA_PLAYBOOK.md`).

## 2. Worktree and branch created (by Claude)

- Worktree: `skxnz-claude-d6b-commerce-ui`
- Branch: `claude/d6b-commerce-ui`, based at `a98811b`
- Dependencies: Windows directory junction `node_modules` -> main repo
  `node_modules` (no network reinstall).
- All D6-B edits happened only inside this worktree.

## 3. Routes/components inspected

- `app/shop/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`,
  `app/checkout/success/page.tsx`, `app/product/[id]/page.tsx`
- `components/buyer/shop-catalog.tsx`, `shop-browser.tsx`,
  `product-detail-shell.tsx`, `product-purchase-panel.tsx`,
  `cart-preview-table.tsx`
- `components/shared/product-grid.tsx`, `empty-state.tsx`
- `components/sections/product-card.tsx`
- `components/checkout/place-draft-order.tsx` (D5-B contract, read-only),
  `lib/checkout/order-attempt.ts` (read-only)
- `tests/commerce-actions.test.cjs`, `tests/tsconfig.json`
- `AGENTS.md` was not present in the worktree tree at `a98811b`.

## 4. Defects found

1. `components/shared/empty-state.tsx` rendered a hard-coded "MVP Placeholder"
   kicker to buyers (cart empty, shop empty, product-not-found).
2. `components/shared/product-grid.tsx` default empty copy told buyers to
   "Add placeholder products to start testing the catalog layout."
3. `components/buyer/shop-browser.tsx` filter copy said "local demo catalog";
   shop empty state had no next action.
4. `app/shop/page.tsx` preview note said "local MVP preview data".
5. Product-detail href inconsistency: product card linked
   `/product/${product.slug}` while cart rows linked `/product/${product.id}`.
   Worked only because seed products use `id === slug`; fragile for live rows.
6. Purchase panel stock chip always showed product-level `stock` even when a
   specific variant was selected (potentially misleading count).
7. Size/color selector buttons had no `aria-pressed` state; quantity stepper
   ignored known available stock (client-side cap only; server still validates).
8. Cart summary had no notice that prices/stock are re-verified server-side
   before a draft order is saved.

No dead routes found: `/shop`, `/product/[id]`, `/cart`, `/checkout`,
`/checkout/success` all resolve; product not-found renders an explicit empty
state with "Back To Shop" (no silent homepage fallback).

## 5. Fixes implemented

- New `lib/catalog/product-links.ts` — `getProductHref()` canonical product
  URL helper (slug first, id fallback, URL-encoded). Used by product card
  (image title + View button) and cart rows (image + title links).
- `empty-state.tsx`: "MVP Placeholder" removed; neutral configurable kicker
  (default "SKXNZ").
- `product-grid.tsx`: truthful default empty copy; new
  `emptyActionHref`/`emptyActionLabel` props wired through to `EmptyState`.
- `shop-browser.tsx`: "local demo catalog" copy removed; empty state now has
  "Browse Full Catalogue" action to `/shop`.
- `app/shop/page.tsx`: "local MVP preview data" -> "local preview data".

## 6. Product/shop polish

- Product card title is now a link (larger clickable area) with hover state
  and `aria-label` on the View button.
- Empty catalogue/filter states now include a useful next action.

## 7. Product detail polish

- Stock chip shows the selected option's stock ("N units for this option")
  when a variant-backed product has a size selected; product-level count
  otherwise.
- Size and color selector buttons expose `aria-pressed`.
- Quantity stepper caps at known available stock (still server-validated;
  no reservation claim added anywhere).
- Quantity value announces changes via `aria-live="polite"`.
- Add-to-cart disabled/unavailable states unchanged and verified truthful
  ("Currently Unavailable", "Selected option unavailable", "Select A Size").

## 8. Cart polish

- Cart summary now states prices and stock are re-checked on the server
  before any draft order is saved and that the total may change.
- Cart product links unified through `getProductHref`.
- Empty cart state keeps "Back To Shop" action; leaked "MVP Placeholder"
  kicker removed via the shared component fix.

## 9. Checkout polish

- Audited `place-draft-order.tsx`, `order-attempt.ts`, and
  `checkout/success/page.tsx` against Task E. The D5-B state model already
  meets requirements: NOT_WIRED maps to buyer-friendly "Draft checkout is not
  ready" copy; raw backend codes/messages are never rendered; payment stays
  disabled; drafts are consistently described as unpaid; conflict/retry copy
  is understandable; `aria-live`/role semantics present. No code changes were
  needed; new regression tests lock this in (see below). Backend contract
  untouched.

## 10. Accessibility / mobile

- `aria-pressed` on size/color selectors; `aria-live` quantity; `aria-label`
  on card View link (existing labels on gallery, quantity, and cart controls
  verified). Layouts already use `min-w-0` + responsive grids; no overflow
  defects found in the audited commerce components.

## 11. Tests and exact results

New/extended tests appended to `tests/commerce-actions.test.cjs` (7 new):

1. product hrefs use the canonical slug with id fallback and encoding
2. product card and cart rows link through the shared product href helper
3. unavailable variant keeps add-to-cart disabled with truthful label
4. cart summary keeps the server-verification and no-payment notices visible
5. buyer commerce empty states carry useful next actions
6. buyer commerce rendered copy has no demo, mock, or MVP leakage
7. draft checkout copy never claims a paid or confirmed order

`tests/tsconfig.json` include list gained `../lib/catalog/product-links.ts`.

Results:

- `pnpm.cmd run test:commerce`: **95 tests, 95 pass, 0 fail** (88 existing +
  7 new).
- `pnpm.cmd exec tsc --noEmit --incremental false`: clean, 0 errors.
- ESLint on all changed app/components/lib files: 0 errors, 0 warnings
  (one pre-existing `react-hooks/exhaustive-deps` warning in
  `product-purchase-panel.tsx` fixed by removing an unnecessary dependency).
- `git diff --check`: clean.
- Honesty scan: enforced by new test 6 across buyer commerce files.
- Secret scan over the diff: no keys/tokens/secrets.
- Import/reference scan: all `getProductHref` imports resolve; no orphan refs.

## 12. Runtime limitations

- No browser/dev-server verification was run: the preview tooling launches
  from the main worktree, which does not contain D6-B edits, so a preview
  would not exercise this branch. Verification is via the compiled test
  suite, full tsc, and ESLint instead.
- Production `next build` not run in this Windows environment (known
  environment limitation from earlier days; not treated as a code failure).

## 13. Files changed

- `app/shop/page.tsx`
- `components/buyer/cart-preview-table.tsx`
- `components/buyer/product-purchase-panel.tsx`
- `components/buyer/shop-browser.tsx`
- `components/sections/product-card.tsx`
- `components/shared/empty-state.tsx`
- `components/shared/product-grid.tsx`
- `lib/catalog/product-links.ts` (new)
- `tests/commerce-actions.test.cjs`
- `tests/tsconfig.json`
- `docs/SKXNZ_LAUNCH_WAR_D6_B_COMMERCE_UI_POLISH.md` (this report)

## 14. Confirmations

- Worktree created by Claude; all work confined to it.
- No push. No deployment. No live SQL applied.
- No changes to `supabase/migrations/**`, `supabase/verification/**`,
  RLS/RPC/backend contracts, environment files, or D6-A docs.
- `PROGRESS.md` not edited (reserved for Day 6 integration).
- Main worktree untouched; unrelated local/untracked files preserved.
- No Razorpay or delivery-provider integration added; no claim that payment,
  refunds, delivery tracking, inventory reservation, or launch readiness is
  live.
