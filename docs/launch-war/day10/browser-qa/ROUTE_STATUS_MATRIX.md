# D10-A HTTP route status matrix

Every HTTP request below used `http://localhost:3002`. `BLOCKED` means middleware returned HTTP 500 for missing Supabase public configuration before the page or auth redirect could execute. Visual and console assertions were not possible.

| Route | Static route | HTTP | Redirect | Result | Notes |
| --- | --- | ---: | --- | --- | --- |
| `/` | Present | 500 | None | BLOCKED | Page render not reached. |
| `/shop` | Present | 500 | None | BLOCKED | Grid and catalog fallback not rendered. |
| `/brands` | Present | 500 | None | BLOCKED | Brand index not rendered. |
| `/faq` | Present | 500 | None | BLOCKED | Public copy not rendered. |
| `/support` | Present | 500 | None | BLOCKED | Public support route not rendered. |
| `/returns` | Present | 500 | None | BLOCKED | Public policy route not rendered. |
| `/ai` | **Missing index page** | 500 | None | FAIL / BLOCKED | Middleware masks the expected route-level 404. Implemented entry points include `/ai-stylist` and `/ai/stylist`. |
| `/community` | Present | 500 | None | BLOCKED | Community preview not rendered. |
| `/cart` | Present | 500 | None | BLOCKED | Cart UI not rendered. |
| `/checkout` | Present | 500 | None | BLOCKED | Checkout UI not rendered; no payment action attempted. |
| `/orders` | Present, protected | 500 | None | BLOCKED | Expected unauthenticated login redirect not reached. |
| `/account` | Present, protected | 500 | None | BLOCKED | Expected unauthenticated login redirect not reached. |
| `/account/orders` | Present, protected | 500 | None | BLOCKED | Expected unauthenticated login redirect not reached. |
| `/account/returns` | Present, protected | 500 | None | BLOCKED | Expected unauthenticated login redirect not reached. |
| `/account/support` | Present, protected | 500 | None | BLOCKED | Expected unauthenticated login redirect not reached. |
| `/seller` | Present, SELLER/ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/seller/orders` | Present, SELLER/ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/admin` | Present, ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/admin/operations` | Present, ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/admin/orders` | Present, ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/admin/returns` | Present, ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |
| `/admin/support` | Present, ADMIN | 500 | None | BLOCKED | Role gate exists in source; runtime redirect not reached. |

## Dynamic catalog evidence

- `/product/[id]`, `/brands/[slug]`, and `/categories/[slug]` page patterns exist.
- `getProductHref` selects a trimmed slug and falls back to id, then URL-encodes it.
- The source-backed path `/product/obsidian-signal-oversized-tee` returned HTTP 500 from the same middleware configuration blocker; product-page behavior was not reached.
- `/brands/skxnz` and `/categories/men` were also configuration-blocked.
- No product slug was invented and no dead-card browser claim is made.
