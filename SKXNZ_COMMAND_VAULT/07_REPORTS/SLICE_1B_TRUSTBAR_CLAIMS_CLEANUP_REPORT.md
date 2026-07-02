---
title: Slice 1b — Trust-Bar Claims Cleanup
date: 2026-07-02
tags:
  - report
  - slice
  - brand
  - claims
  - legal-clean
type: report
agent: skxnz-brand-guardian
status: complete
app_source_touched: lib/home-data.ts
commit: false
push: false
pr: false
---

# Slice 1b — Trust-Bar Claims Cleanup

> [!abstract] Scope
> Single-file copy/claims slice. Edited only the `trustItems` array in `lib/home-data.ts`. No other export, no other file. Finishes the claims-cleanup objective left open by [[SLICE_1_HOMEPAGE_CLAIMS_CLEANUP_REPORT|Slice 1]] (trust-bar copy was in a forbidden file then).

## File edited
- `lib/home-data.ts` — only the `trustItems` array (`icon`/`title`/`desc` shape unchanged). No import, type, schema, or styling change.

## Claims removed (unverified → gone)
- **"Verified Sellers" / "100% Authentic"** — no seller-verification or authentication system in code. Absolute-truth claim ("100%") + authenticity guarantee = highest legal risk. Removed.
- **"Secure Payments" / "Protected Checkout"** — payments 0% built (`lib/data/orders.ts` status literally `"Not Connected in MVP"`, per [[BACKEND_ARCHITECTURE_READONLY_AUDIT]]). Removed.
- **"Fast Delivery" / "Across India"** — no Shiprocket, no shipments table, no rider layer. Speed + nationwide-coverage claim removed.
- **"AI Style Help" / "Smart Recommendations"** — AI is local rule-based, not live smart recs (per [[SUPABASE_SECURITY_DEEP_AUDIT]] / backend audit). Removed.
- **"Easy Returns" / "Hassle-free"** — no returns/refund system (`refundStatus: "Not Connected in MVP"`). Removed.

## Claims softened (future-safe replacements)

| # | Was (title / desc) | Now (title / desc) | Frame |
|---|---|---|---|
| 1 | Verified Sellers / 100% Authentic | **Curated Labels / Hand-Picked** | editorial intent — true (catalog is curated), no guarantee |
| 2 | Secure Payments / Protected Checkout | **Encrypted Checkout / Coming Soon** | planned feature, explicitly unshipped |
| 3 | Easy Returns / Hassle-free | **Simple Returns / In Development** | planned, not live |
| 4 | Fast Delivery / Across India | **Nationwide Shipping / Rolling Out** | planned rollout, no speed/coverage promise |
| 5 | AI Style Help / Smart Recommendations | **AI Styling / In Development** | planned, matches actual AI state |

## Final trust-bar wording
1. ✓ **Curated Labels** — Hand-Picked
2. 🔒 **Encrypted Checkout** — Coming Soon
3. ↩ **Simple Returns** — In Development
4. ⚡ **Nationwide Shipping** — Rolling Out
5. ✦ **AI Styling** — In Development

## Why the new copy is safer
- No absolute/authenticity guarantee ("100%", "Verified", "Authentic") — the highest-liability language is gone.
- Every unbuilt system (payments, returns, delivery, AI) now carries an explicit future marker ("Coming Soon", "In Development", "Rolling Out") — truthful about MVP state, no live-feature assertion.
- "Curated Labels / Hand-Picked" is a truthful editorial statement about the catalog, not a verification promise.
- Tone stays short, premium, futuristic, Gen Z luxury. No competitor names/phrasing copied.
- Data shape untouched (`icon`/`title`/`desc`) → zero risk to `trust-bar.tsx` consumer (`.map()` only).

## Any risk left
- **Icons vs copy:** 🔒 with "Encrypted Checkout" and ⚡ with "Nationwide Shipping" pair a live-looking glyph with a future label. Reads as future because of the desc line, but if a stricter pass wants zero live-implication, icons could be neutralized later. Low.
- Homepage still renders these via `trust-bar.tsx` unchanged — no visual/layout regression expected, but not browser-verified this slice (data-only change; full-app run out of scope). Low.
- `aiSteps` labels (`Set Your Budget` etc.) untouched — process steps, not claims, left as-is.

## Check result
- `git diff -- lib/home-data.ts`: only the `trustItems` array changed; shape intact.
- Only `lib/home-data.ts` newly modified in app/source (was clean before this slice; all other dirty files pre-existing).

## App/source touched
- **Only `lib/home-data.ts`.** No forbidden path touched (no `app/`, `components/`, `src/`, `supabase/`, `scripts/`, `package.json`, `pnpm-lock.yaml`, `tailwind.config.ts`, `components.json`).

## Commit / push / PR
- No / No / No.

## Related
[[SLICE_1_HOMEPAGE_CLAIMS_CLEANUP_REPORT]] · [[PARALLEL_AGENT_RUN_SUMMARY]] · [[BACKEND_ARCHITECTURE_READONLY_AUDIT]] · [[SUPABASE_SECURITY_DEEP_AUDIT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]]
