# D9-A route smoke matrix

Browser/mobile QA is pending. “Degraded” describes the intended safe state when draft migrations/RPCs or live integrations are unavailable.

| Route | Access / auth | Expected degraded state | Launch risk | Mobile QA |
| --- | --- | --- | --- | --- |
| `/` | Public | Discovery only; no live commerce promise | YELLOW | Required |
| `/shop` | Public | Catalog may be empty if catalog baseline is unavailable | RED | Required |
| `/cart` | Public | Local cart; totals are rechecked server-side | YELLOW | Required |
| `/checkout` | Buyer required to create draft | `NOT_WIRED` must remain truthful; no payment completion | RED | Required |
| `/orders` | Session required | Scoped history; unavailable data must not leak | RED | Required |
| `/account` | Session required | Buyer-safe account state | YELLOW | Required |
| `/account/orders` | Session required | Redirects to scoped order history | YELLOW | Required |
| `/account/returns` | Session required | Truthful unavailable/empty return state | YELLOW | Required |
| `/account/support` | Session required | Scoped support state | YELLOW | Required |
| `/support` | Public | Informational route; no SLA promise | YELLOW | Required |
| `/returns` | Public | Policy only; no refund execution promise | YELLOW | Required |
| `/faq` | Public | Private-preview truth copy | GREEN | Required |
| `/brands` | Public | Catalog-dependent discovery | RED | Required |
| `/ai` | Public | Preview/degraded when provider unavailable | YELLOW | Required |
| `/community` | Public | Future-facing/community preview only | YELLOW | Required |
| `/seller` | SELLER or ADMIN required | Read-only if 0009 boundary absent | RED | Required |
| `/seller/orders` | SELLER or ADMIN required | Seller-owned lines only; `NOT_WIRED` read-only state | RED | Required |
| `/admin` | ADMIN required | Protected operations overview | YELLOW | Required |
| `/admin/operations` | ADMIN required | Counts/read-only operations when dependencies absent | YELLOW | Required |
| `/admin/orders` | ADMIN required | Atomic status action must be `NOT_WIRED` if 0010 absent | RED | Required |
| `/admin/returns` | ADMIN required | Atomic return action must be `NOT_WIRED` if 0010 absent | RED | Required |
| `/admin/support` | ADMIN required | Scoped support operations; no SLA/email claim | YELLOW | Required |

Smoke requires unauthenticated redirect checks, BUYER/SELLER/ADMIN role checks, narrow mobile widths, keyboard navigation, and truthful unavailable-state copy. Mocked automated tests do not prove browser rendering, live RLS, or production database concurrency.
