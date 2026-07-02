---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 03 — FRONTEND STATUS

_Verified from code, 2026-07-02. Next.js App Router + TypeScript + Tailwind._

## Design intent (owner's requirements)
Compact premium layout · white / off-white base · **solid dark maroon header (not glassy)** · no cheap gradients · no generic cards · no clutter · no oversized text · full (not empty) homepage · brand bar uses logos · category mosaic allowed · fully responsive.

## Page inventory (exists / renders)
- **Buyer:** home (`app/page.tsx`), shop, product `[id]`, brands + `[slug]`, categories `[slug]`, search, cart, checkout + success, wishlist, orders + `[id]`, account (+ profile, addresses, orders, wishlist, cart-sync).
- **Seller:** page, apply, dashboard, inventory, orders, products (+ new), tools, analytics, login.
- **Admin:** dashboard, users, sellers, products, orders, returns, support, content, community, analytics, login.
- **AI:** stylist, title-generator, description-generator, video-prompt-generator (+ older `ai-tools/*`, `ai-stylist`).
- **Info:** about, contact, faq, terms, privacy, returns, shipping, authenticity, community(+guidelines), seller-terms, waitlist, sell.

## Looks done
- Full page/route coverage across all sections.
- Homepage sections built: hero carousel, trending grid, category strip, featured labels, product rows, AI stylist banner, trust bar, limited signals, footer, navbar.
- Auth UI (login/signup/account) cleaned for real Supabase.
- Buyer UI moving to white bg + compact cards (branch in progress).
- Design tokens defined in `app/globals.css` (`--skxnz-maroon`, obsidian, wine, etc.).

## Still needs polish
| Area | File(s) | Issue |
|---|---|---|
| Header | `components/shared/navbar.tsx`, `globals.css` `--skxnz-maroon-glass` | Make solid dark maroon, kill glass effect |
| Product cards | `components/sections/product-card.tsx`, `components/shared/product-grid.tsx` | Denser, compact spacing, smaller text |
| Brand bar | `src/components/brands/top-brands-toolbar.tsx` | Use logos, not plain text |
| Category strip | `components/home/category-strip.tsx` | Clipping; consider mosaic/uneven boxes |
| Search | `components/shared/site-search-bar.tsx`, `src/lib/site-search.ts` | Live filter by typed letters; show 4–5 recommended on focus |
| Homepage density | `app/page.tsx` + `components/home/*` | Some areas feel empty; tighten gaps |
| Typography | `globals.css`, `tailwind.config.ts` | Smaller, sharper text scale |
| Buttons | across homepage | Remove unnecessary buttons |
| Gradients | various | Remove cheap gradients, keep flat premium |

## Notes
- Fonts loaded locally: Source Sans 3, Bodoni Moda SC, Merriweather Sans.
- ReactBits lab components present (`components/reactbits/`, `app/reactbits-lab/`) — experimental, has lint warnings to review.
- Data is still mostly static/demo (`src/data/*`, `lib/home-data.ts`) — not yet on real catalog DB.
