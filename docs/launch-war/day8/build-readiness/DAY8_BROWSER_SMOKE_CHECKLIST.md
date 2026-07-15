# Day 8 browser smoke checklist

Run in non-production QA with approved public configuration.

1. Check `/`, `/shop`, `/product/<slug-or-id>`, `/brands/<slug>`, and `/categories/<slug>` at mobile and desktop widths; verify fallback does not imply live catalog availability.
2. Check cart/checkout with no address, no auth, unavailable order RPC, and a compatible retry. Confirm no paid, refund, courier, or delivery claim.
3. Check `/account`, `/orders`, returns, support, and wishlist as a buyer; confirm middleware redirect and RLS-owned data boundaries.
4. Check seller A versus seller B on seller order/product routes; confirm read-only handling where 0009 is unapplied.
5. Check ADMIN routes, then buyer/seller attempts to access them; confirm redirects and no raw internal errors.
6. Fetch `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest`; confirm protected paths are not listed publicly.
7. Record viewport, user role, route, browser, result, and screenshot outside source control. Stop on exposed data, false completion copy, or auth bypass.
