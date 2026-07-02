---
title: Slice 1 & 1b Diff Review
date: 2026-07-02
tags:
  - report
  - review
  - diff
  - claims
  - pre-commit
type: diff-review
agent: skxnz-master-planner
status: complete
app_source_touched: false
commit: false
push: false
pr: false
---

# Slice 1 & 1b Diff Review

> [!abstract] Purpose
> Pre-commit review of the exact working-tree diff for the homepage claims-cleanup slices. Read-only; only this report written. **Do not commit yet.**

**Date:** 2026-07-02

## Files reviewed
- `components/home/ai-stylist-banner.tsx` (Slice 1)
- `lib/home-data.ts` (Slice 1b)

---

## Source diff summary

### `lib/home-data.ts` — clean, copy-only ✅
- Only the `trustItems` array changed. 5 entries, `title` + `desc` reworded.
- `icon` values untouched. Array order untouched. `TrustItem` shape (`icon`/`title`/`desc`) untouched.
- No import, type, export, or other-array change. `aiSteps` and all other exports untouched.

### `components/home/ai-stylist-banner.tsx` — copy + pre-existing styling ⚠️
- **Claims copy (Slice 1 intent):** badge `BETA`→`COMING SOON`; body "Outfit ideas and recommendations…"→"Designed to suggest outfits… — launching soon"; CTA `Try AI Stylist`→`Get Early Access`.
- **Also present (pre-existing dirty-tree polish, NOT claims):**
  - Layout: `max-w-[1440px]`→`[1600px]`; `px-6 sm:px-10 lg:px-16`→`px-5 sm:px-8 lg:px-12`; card `px-8 py-10 sm:px-12 sm:py-14`→`px-6 py-8 sm:px-10 sm:py-10`; `py-12`→`py-10`.
  - Shape: `rounded-2xl`→`rounded-xl`.
  - Color: heading `text-[#F4F1EC]`→`text-white`; body `text-[#F4F1EC]/55`→`text-white/58`.
  - `href="/ai-stylist"` unchanged; imports unchanged.

> [!warning] Scope note
> The banner file's diff mixes Slice 1 copy edits with layout/color polish that pre-dated the slice (documented in [[SLICE_1_HOMEPAGE_CLAIMS_CLEANUP_REPORT]] "Risks"). Committing this file commits both. Not a claims risk — but the commit is not purely "claims cleanup." Owner should accept the bundled styling or split the file's hunks before commit.

---

## Claims removed
- Verified Sellers / 100% Authentic
- Secure Payments / Protected Checkout
- Easy Returns / Hassle-free
- Fast Delivery / Across India
- AI Style Help / Smart Recommendations
- Banner: `BETA` label; "recommendations based on…" live-tool phrasing; "Try AI Stylist" CTA.

## Claims softened
| Was | Now | Frame |
|---|---|---|
| BETA | COMING SOON | unshipped |
| "Outfit ideas and recommendations…" | "Designed to suggest… launching soon" | intent, not live |
| Try AI Stylist | Get Early Access | truthful for unshipped |
| Verified Sellers / 100% Authentic | Curated Labels / Hand-Picked | editorial, no guarantee |
| Secure Payments / Protected Checkout | Encrypted Checkout / Coming Soon | planned |
| Easy Returns / Hassle-free | Simple Returns / In Development | planned |
| Fast Delivery / Across India | Nationwide Shipping / Rolling Out | planned |
| AI Style Help / Smart Recommendations | AI Styling / In Development | matches actual AI state |

## Verification vs claim rules
- ❌ No fake **AI** live claim — all AI copy future-marked ("launching soon", "In Development").
- ❌ No fake **payment** claim — "Encrypted Checkout / Coming Soon".
- ❌ No fake **delivery** claim — "Nationwide Shipping / Rolling Out".
- ❌ No **verified-seller / authenticity guarantee** — "Curated Labels / Hand-Picked".
- ❌ No **official/certified brand** or competitor phrasing introduced.
- ✅ Tone premium, futuristic, Gen Z luxury, short.

## Any risky wording left
- 🔒 "Encrypted Checkout" and ⚡ "Nationwide Shipping" pair a live-looking glyph with a future `desc`; reads future because of the desc line. Low.
- "Curated Labels / Hand-Picked" implies active curation — truthful (catalog is editorially selected); not a verification promise. Low.
- No high-risk wording remains.

## Data shape changed
- **No.** `TrustItem` shape and array length preserved; consumer `trust-bar.tsx` (`.map()`) unaffected.

## Layout / styling changed
- `home-data.ts`: **No.**
- `ai-stylist-banner.tsx`: **Yes — pre-existing polish** (widths, padding, radius, heading/body color to `white`). White on `#111116` raises contrast; no overflow/break risk at reviewed classes. Not part of the claims objective.

## Forbidden files touched
- **None.** No `app/` routes, `src/`, `supabase/`, `scripts/`, `package.json`, `pnpm-lock.yaml`, `tailwind.config.ts`, `components.json`. Only the two approved source files + vault reports.

---

## Safe to commit
> [!success] Yes — with disclosure
> Claims are legally clean and buildable. Safe to commit **provided** the owner accepts that `ai-stylist-banner.tsx` also carries the pre-existing styling polish (not just copy). If a pure claims-only commit is required, stage the banner file's copy hunks selectively; otherwise commit as-is.

## Exact files recommended for commit
```
components/home/ai-stylist-banner.tsx
lib/home-data.ts
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_1_HOMEPAGE_CLAIMS_CLEANUP_REPORT.md
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_1B_TRUSTBAR_CLAIMS_CLEANUP_REPORT.md
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_1_AND_1B_STATUS_UPDATE.md
SKXNZ_COMMAND_VAULT/07_REPORTS/SLICE_1_1B_DIFF_REVIEW.md
SKXNZ_COMMAND_VAULT/01_COMMAND_CENTER/CURRENT_STATUS.md
SKXNZ_COMMAND_VAULT/01_COMMAND_CENTER/NEXT_ACTIONS.md
SKXNZ_COMMAND_VAULT/03_AGENT_SYSTEM/AGENT_TASK_BOARD.md
```
> [!danger] Explicit-path staging only
> Stage each path by name. Do **not** `git add -A` / `git add .` — the working tree has ~26 other pre-existing dirty app/source files (see [[DIRTY_TREE_INVENTORY]]) that must stay out of this commit.

## Exact commit message
```
chore(home): clean unverified homepage trust + AI claims (Slice 1/1b)

Soften homepage copy so no unbuilt feature is claimed as live:
- ai-stylist-banner: BETA -> COMING SOON, CTA -> Get Early Access,
  body reworded to "designed to / launching soon"
- home-data trustItems: verified-seller/authenticity, secure payments,
  fast delivery, live AI, easy returns -> future-safe premium copy
  (data shape unchanged; consumer trust-bar unaffected)

No deps/config/backend/Supabase changes. Vault reports included.
Note: ai-stylist-banner also carries pre-existing layout/color polish.
```

---

## Related
[[SLICE_1_HOMEPAGE_CLAIMS_CLEANUP_REPORT]] · [[SLICE_1B_TRUSTBAR_CLAIMS_CLEANUP_REPORT]] · [[SLICE_1_AND_1B_STATUS_UPDATE]] · [[DIRTY_TREE_INVENTORY]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
