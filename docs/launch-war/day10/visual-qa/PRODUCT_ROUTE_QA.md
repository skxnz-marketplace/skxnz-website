# D10-B Product Route QA

## Entry from homepage
FAIL for product intent: homepage product cards do not link to product pages. Zero `a[href^="/product"]` anchors on `/`; the "Obsidian Utility Jacket" card resolves to `href="/shop"`. Buyer cannot reach any PDP from homepage cards.

## Entry from /shop
PASS: 30 `/product/...` anchors in grid (15 products × VIEW + card link). Tested `/product/obsidian-signal-oversized-tee`.

## PDP result: PASS (structure), WARN (imagery)
- Loads 200, title "Obsidian Signal Oversized Tee | SKXNZ" (correct, no dup suffix here).
- Renders: brand badge, "APPROVED PREVIEW" tag, name, description, ₹1,999 with ₹2,499 compare, category chips, stock ("In stock / 50 units"), size selector (S–XXL) with "SELECT A SIZE" gate on CTA, color, quantity stepper, SAVE / VIEW CART / ASK SKXNZ AI.
- Truthful copy intact: "Live payment, delivery, and refund processing are not connected yet", sample delivery timeline flagged as sample, returns marked preview-only.
- Accordion sections (Product Details / Size Guide / Delivery and Returns) present.
- Similar products rail renders 3 cards with working `/product` links; one card copy leaks "demo" ("Layered premium demo shirt").
- Imagery: 1 `<img>` on entire page — hero gallery is placeholder-driven. Main visual-quality gap.
- Mobile 390: no horizontal overflow.
- Console: no red errors.
