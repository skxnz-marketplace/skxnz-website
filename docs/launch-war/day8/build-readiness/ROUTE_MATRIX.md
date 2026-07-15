# D8-A route matrix

This matrix describes routes present in `app/` at `bc7b2ae`; it does not invent unimplemented routes. "QA" means browser/mobile verification still required.

| Route | File | Access / state | Data and degraded behaviour | QA / risk |
| --- | --- | --- | --- | --- |
| `/`, `/shop`, `/product/[id]`, `/brands`, `/brands/[slug]`, `/categories/[slug]` | matching `app/**/page.tsx` | Public discovery | Catalog query falls back safely where live catalog is absent | QA; High catalog baseline dependency |
| `/cart`, `/checkout`, `/checkout/success` | `app/cart`, `app/checkout/**` | Public shell; draft creation requires buyer auth/address | Atomic draft RPC unavailable returns truthful `NOT_WIRED`; no payment completion | QA; High payment/order QA |
| `/orders`, `/orders/[id]`, `/account/**`, `/wishlist` | matching pages | Middleware requires session | Session/RLS reads; missing tables/RPCs render truthful unavailable/read-only states | Auth QA; High |
| `/account/orders`, `/account/returns`, `/account/support/[id]` | matching pages | Middleware requires session | Orders redirect/read real history; returns/support depend on commerce tables | Auth/mobile QA; High |
| `/support`, `/returns`, `/faq`, `/shipping`, `/contact`, `/terms`, `/privacy` | matching pages | Public informational | Truthful policy/support copy; no live SLA/refund/delivery promise | Browser QA; Medium |
| `/ai-stylist`, `/ai/**`, `/ai-tools/**`, `/community` | matching pages | Public preview surfaces | AI/community features remain preview/degraded where provider or moderation is unavailable | Browser QA; Medium |
| `/seller`, `/seller/orders/[id]`, `/seller/products/**`, `/seller/dashboard`, `/seller/inventory`, `/seller/analytics`, `/seller/tools`, `/seller/apply` | matching pages | Middleware requires SELLER or ADMIN except login/apply as routed | Order line actions are read-only if 0009 RPC is unavailable; analytics/inventory preview areas remain labelled | Auth/mobile QA; High |
| `/admin`, `/admin/operations`, `/admin/orders/[id]`, `/admin/returns/[id]`, `/admin/support/[id]`, `/admin/products`, `/admin/users`, `/admin/sellers`, `/admin/content`, `/admin/community`, `/admin/analytics` | matching pages | Middleware requires ADMIN; login excluded | Atomic admin actions return `NOT_WIRED` until 0010 is applied; no payment/refund mutation | Auth/mobile QA; High |
| `/login`, `/signup`, `/auth/callback`, `/waitlist`, `/sell` | matching pages/routes | Public entry | Supabase configuration and authenticated browser QA still required | Auth QA; High |

`/categories/[slug]` is the active category pattern. There is no `/category/[slug]`. Protected routes are intentionally excluded from the sitemap and disallowed in robots.
