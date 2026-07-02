---
tags: [skxnz, frontend]
---
# FRONTEND PROMPTS

_Use only after owner unlocks build phase._

## Header solid maroon
```
Make header solid dark maroon (--skxnz-maroon #3a0818). Remove glass/blur/transparency.
Touch: components/shared/navbar.tsx, app/globals.css. Report files changed.
```

## Compact homepage + cards
```
Tighten homepage density; compact product cards (smaller text, tight spacing, dense grid).
Touch: app/page.tsx, components/home/*, components/sections/product-card.tsx, components/shared/product-grid.tsx.
White/off-white bg, no new gradients, responsive. Report files changed.
```

## Brand bar logos
```
Brand toolbar uses brand logos, not text. Touch: src/components/brands/top-brands-toolbar.tsx. Report.
```

## Search UX
```
On focus show 4–5 recommended; live filter by typed letters (case-insensitive).
Touch: components/shared/site-search-bar.tsx, src/lib/site-search.ts. Report.
```

Related: [[UI_UX_MEMORY]] · [[DESIGN_RULEBOOK]]
