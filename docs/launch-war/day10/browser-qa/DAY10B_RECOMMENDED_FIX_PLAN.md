# Day 10-B recommended fix plan

## Gate 0 — obtain usable evidence

1. Provide approved non-secret public Supabase QA configuration to a disposable/local runtime without committing or printing values.
2. Re-run the HTTP matrix and prove public 200/route-level responses plus unauthenticated login redirects.
3. Use a manual browser session or an approved automation surface that can identify its URL; capture desktop, 768px, and 390px screenshots for the buyer routes.
4. Use safe BUYER, SELLER, and ADMIN QA sessions supplied by the operator; do not invent credentials.

## Focused buyer recovery

After visual evidence exists, prioritize the homepage first fold, shop grid/sidebar, product cards and image fallbacks, one dynamic product page, cart, and checkout. Compare against the strongest approved earlier direction and the founder's feedback. Keep the existing truthful private-preview language and avoid a wholesale design-system rewrite.

## Secondary sweep

Review brand/category pages, FAQ/support/returns, AI entry points, and community for consistency. Resolve the `/ai` canonical-entry decision before adding any route or redirect. Then verify seller/admin mobile readability without disturbing their currently stronger visual direction.

## Standing gates

Canonical `0002_catalog_layer.sql` remains unrecovered; disposable Supabase QA is incomplete; payment, refund, and delivery are not live; native Vercel/Linux build proof is pending; authenticated browser/mobile QA is pending. No UI work changes those blockers.
