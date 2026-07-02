---
title: Slice 1 — Homepage Claims Cleanup
type: report
status: complete
date: 2026-07-02
agent: skxnz-brand-guardian
commit: false
push: false
pr: false
---

# Slice 1 — Homepage Claims Cleanup

## Files edited
- `components/home/ai-stylist-banner.tsx` — copy softened (3 strings).
- `components/home/trust-bar.tsx` — **NOT edited by this slice.** No editable claim copy exists in this file (see Risks).

## Claims removed
- None fully removed. All handled by softening.

## Claims softened
In `components/home/ai-stylist-banner.tsx`:
1. Badge `BETA` → `COMING SOON`. "BETA" implies a working, live product. AI Stylist not proven live in code → future-safe label.
2. Body copy `Outfit ideas and recommendations based on your budget, occasion, and style.` → `Designed to suggest outfits around your budget, occasion, and style — launching soon.` "Designed to" + "launching soon" = future-safe intent, not a live-feature claim.
3. CTA `Try AI Stylist` → `Get Early Access`. "Try" asserts a usable live tool; "Get Early Access" is truthful for an unshipped feature. Link target `/ai-stylist` unchanged (structure intact).

## Copy decisions
- Kept `Your personal style companion` (h2) — aspirational positioning, not a factual live-feature claim.
- Kept `AI Stylist` secondary label — it names the feature, not its live status; the `COMING SOON` badge now qualifies it.
- Tone kept ultra-premium, sharp, futuristic, Gen Z luxury. No casual/childish/cheap wording. No competitor phrasing copied.
- No layout/structure changes and no styling changes made by this slice. No packages imported.

## Risks / Blockers
- **trust-bar.tsx claims are unreachable from allowed files.** The trust-bar strings — `Verified Sellers` / `100% Authentic`, `Secure Payments` / `Protected Checkout`, `Easy Returns` / `Hassle-free`, `Fast Delivery` / `Across India`, `AI Style Help` / `Smart Recommendations` — are defined in `lib/home-data.ts` (`trustItems`), a **forbidden** file. `trust-bar.tsx` only `.map()`s that data and contains no hardcoded claim copy. These are unverified claims (verified sellers, secure payments, delivery, AI) but CANNOT be fixed without editing `lib/home-data.ts`. **Deferred to a future slice that includes lib/home-data.ts in scope.**
- `aiSteps` labels (`Set Your Budget`, `Choose Occasion`, `Pick Your Style`) also live in `lib/home-data.ts` — process steps, low risk, left as-is and out of scope.
- Pre-existing uncommitted changes: both files already carried unrelated styling/layout edits (max-width, padding, colors) in the working tree before this slice began. Those are visible in `git diff` but were **not** made by this slice.

## Test / check result
- `tsc --noEmit -p tsconfig.json`, filtered to the two files: **No type errors in the two allowed files.**
- Per-file tsc without project config showed false JSX/path-alias errors (expected; not real).

## App/source touched
- Only `components/home/ai-stylist-banner.tsx`. No forbidden paths touched.

## Commit / push / PR
- No / No / No.
