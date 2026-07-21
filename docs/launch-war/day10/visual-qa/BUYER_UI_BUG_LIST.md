# D10-B Buyer UI Bug List (prioritized)

## P0 — broken route / unusable flow
None. All buyer routes load; auth redirects correct; no console red errors.

## P1 — buyer first-impression damage
1. **Homepage fallback catalog is fictional and unclickable-to-product.** Trending/New In/Luxury Finds cards (VANTA Obsidian Utility Jacket ₹7,499, AXIS Chrome Runner ₹12,999, HALO Obsidian Chronograph ₹34,999, …) are not real catalog products; every card links to plain `/shop` (0 `/product/...` anchors on homepage, 91 anchors to `/shop`). Click intent is broken and prices don't match anything purchasable.
2. **Imageless catalog everywhere.** Homepage: 2 imgs (logos only). `/shop`: 1 img. PDP: 1 img. All product cards are text/gradient tiles — the single biggest "site feels worse" driver.
3. **`/ai-stylist` shows internal demo gate to public buyers.** "DEMO ACCESS REQUIRED", "CONTINUE AS BUYER / SELLER / ADMIN", SSR h1 "Checking saved demo role."
4. **Demo/internal copy on `/shop` brand rail.** "DEMO ATELIER", "Demo premium fashion label used for marketplace testing", "Demo accessory and lifestyle label", "curated demo brand stack". Also PDP similar-card "Layered premium demo shirt".

## P2 — mobile/responsive
5. **Tiny text density at 390px.** ~30 elements on `/` and ~27 on `/shop` with computed font-size < 10px carrying real copy (labels, badges, meta). No horizontal overflow on `/`, `/shop`, `/product/*`, `/ai-stylist`.
6. **Currency mismatch in `/shop` filter.** Price bands "$150 / $150-$250 / $250-$350 / $350+" against ₹ product prices.

## P3 — copy/polish
7. **Title template duplication** — "Checkout Review | SKXNZ | SKXNZ", "Support — SKXNZ | SKXNZ", "Returns — SKXNZ | SKXNZ" (page titles append "SKXNZ" onto a template already suffixed).
8. **Generic titles elsewhere** — `/`, `/shop`, `/brands`, `/cart`, `/faq`, `/ai-stylist` all share "SKXNZ | WEAR THE SIGNAL" (weak for tabs/SEO).
9. **Homepage/shop price divergence** — homepage fallback shows different price universe than live catalog (e.g. no ₹7,499 jacket in shop's 15 products).
