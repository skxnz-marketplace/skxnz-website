---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 07 — KNOWN BUGS & ISSUES

Status: OPEN unless marked. Add new ones as found.

## UI / layout
- [ ] UI too large — text/spacing oversized in places. → smaller, sharper scale.
- [ ] Homepage feels empty in some areas → increase density.
- [ ] Generic-look risk — must stay premium/editorial, not template.
- [ ] Header is glassy → must be **solid dark maroon** (`--skxnz-maroon-glass` used; switch to solid `--skxnz-maroon`).
- [ ] Unnecessary buttons on homepage → remove.
- [ ] Category strip clips/overflows incorrectly (`components/home/category-strip.tsx`).
- [ ] Brand bar uses plain text → should use brand logos (`src/components/brands/top-brands-toolbar.tsx`).
- [ ] Product cards need better compact spacing (`components/sections/product-card.tsx`, `components/shared/product-grid.tsx`).

## Search
- [ ] On click/focus, show 4–5 recommended items.
- [ ] While typing, filter live by matching typed letters (`components/shared/site-search-bar.tsx`, `src/lib/site-search.ts`).

## Backend / data
- [ ] Catalog DB (0002) not applied in Supabase; UI still on static data.
- [ ] Backend/auth status needs ongoing verification after each change.
- [ ] Prisma + Supabase both present — unclear single source of truth (`lib/prisma.ts` vs `supabase/*`). Decide one.
- [ ] AI routes are local rule-based, not real Claude API — don't present AI as "live intelligent" until wired.
- [ ] AI external provider scaffold targets **OpenAI** (`src/lib/ai/provider.ts`), but project goal is **Claude API** — mismatch to resolve.
- [ ] `middleware.ts` refreshes session but route protection is commented out — `/account`, `/seller`, `/admin` are NOT actually guarded.
- [ ] Seller/admin/account pages run on demo/mock data (`lib/data/*`, `*-demo.tsx`) — no real persistence.
- [ ] No payments (Razorpay) — checkout is a mockup.
- [ ] No shipping (Shiprocket).
- [ ] Admin pages not gated by real role/auth check.

## Code quality
- [ ] ReactBits lab components have pre-existing lint warnings (`components/reactbits/`, `app/reactbits-lab/`).

## Fixed
- [x] Signup `name` metadata not saved → fixed (metadata `{ name }` passed; trigger populates `public.users.name`).
- [x] `/account` showed demo copy → now session-aware via `useAuth()`.
