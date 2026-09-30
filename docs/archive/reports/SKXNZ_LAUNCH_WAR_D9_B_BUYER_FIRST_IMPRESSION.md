# SKXNZ Launch War — D9-B: Buyer First-Impression Stabilization

Date: 2026-07-18

## 1. Starting state
- Main repo: `skxnz-day2-clean`, branch `launch-war-july30`, HEAD `b55b7a4` (tracked tree clean; known untracked local docs preserved).

## 2. Worktree
- Created by Claude: `skxnz-claude-d9b-buyer-stabilization`, branch `claude/d9b-buyer-stabilization`, base `b55b7a4`. All edits happened only there.

## 3. Buyer routes inspected
`/`, `/shop`, `/brands`, `/brands/[slug]`, `/categories/[slug]`, `/product/[id]`, `/cart`, `/checkout`, `/faq`, `/ai-stylist` (→ `/ai/stylist`), `/community`.

## 4. Visible regressions found
1. **Shop page internal/dev copy** — sidebar "Preview Notes" mentioned "database query returns empty" and "local preview fallback"; ops-style MetricCards ("Catalogue Mode: Live", "Checkout: Offline") rendered on a buyer page; five stacked badges.
2. **Homepage fallback products carried fabricated discounts** — fictional preview items (VANTA, AXIS, …) showed struck-through `oldPrice` values, i.e. fake markdowns.
3. **Hero claims** — "NEW DROPS DAILY" (untrue cadence claim), "Authenticity guaranteed" (guarantee not in force pre-launch), CTA "Try AI Stylist" implied a live tool.
4. **Home product card keyboard access** — the only product link had `tabIndex={-1}`; the "Preview" pill appeared on hover only; in-image label was near-invisible (`text-white/20`).
5. **AI stylist access gate** — helper text read like internal ops copy ("AI placeholder tools stay behind demo access while public launch mode focuses on…").

Cart, checkout, FAQ, community, brands pages were already truthful and visually stable — left untouched.

## 5. Fixes implemented
- **Homepage / hero** ([lib/home-data.ts](../lib/home-data.ts)): sublines rewritten truthfully; headline "SHARP NEW DROPS."; "authenticity-first curation" instead of a guarantee; CTAs now "Browse the Catalogue" / "Preview AI Stylist". All fallback `oldPrice` values removed (live Supabase compare-at prices still render).
- **Product cards** ([components/home/product-row.tsx](../components/home/product-row.tsx)): product name is now a focusable link with `aria-label` and a visible `focus-visible` outline; preview pill shows on `group-focus-within` as well as hover; in-image label bumped to `text-white/40` and truncated.
- **Shop page** ([app/shop/page.tsx](../app/shop/page.tsx)): buyer-facing titles/descriptions ("Browse approved pieces from curated labels. Checkout opens at public launch."); MetricCards and dev notes replaced by a single "Good to know" card with three plain-language notes; badges trimmed to two (+ optional brand badge). Truth preserved: page still states checkout is not live.
- **AI stylist gate** ([app/ai/stylist/page.tsx](../app/ai/stylist/page.tsx)): area label "AI Assistant Beta"; helper text now premium buyer copy while keeping "No visual try-on or product invention is live."

## 6–8. Scope discipline
No homepage rebuild, no new design system, no logo change, no backend/server-action/migration/RPC/env/build-script edits, no admin/seller surface changes. Mobile behavior untouched except calmer copy; a11y improved via focusable product links + focus-visible outlines.

## 9. Tests and validation
- `pnpm.cmd run test:commerce` — **124 tests, 124 pass, 0 fail** (5 new D9-B source-check tests: no fabricated fallback discounts, no daily-drop/guarantee hero claims, no internal shop copy, keyboard-reachable product card, truthful AI gate copy).
- `pnpm.cmd exec tsc --noEmit --incremental false` — clean.
- ESLint on the 4 changed app/components/lib files — clean.
- `git diff --check` — clean (fixed a CRLF regression introduced during editing).
- Honesty/secret scan of diff (razorpay, secrets, payment/delivery/refund claims) — no hits.
- No production deploy attempted; local SWC build limitation not exercised this session.

## 10. Remaining buyer UI debt
- Homepage product images are still gradient placeholders when catalogue images are missing.
- Fallback preview products still use fictional brand names (acceptable for preview, flagged for replacement once live catalogue depth is sufficient).
- Wishlist heart on home cards is local visual state only (not persisted to account wishlist).
- `/shop` sidebar could collapse on mobile for tighter first fold.

## 11. Files changed
- `app/shop/page.tsx`
- `app/ai/stylist/page.tsx`
- `components/home/product-row.tsx`
- `lib/home-data.ts`
- `tests/commerce-actions.test.cjs`
- `docs/SKXNZ_LAUNCH_WAR_D9_B_BUYER_FIRST_IMPRESSION.md` (this file)
- `PROGRESS.md`

## 12. Confirmations
- Worktree created by Claude; no push, no deployment, no live SQL, no backend/migration/RPC/env/build-script changes; unrelated local files in the main repo preserved.
