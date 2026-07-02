---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 04 — BACKEND STATUS

_Verified from code, 2026-07-02. Only what actually exists is marked present._

## ✅ Present and working
### Supabase Auth
- Clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/admin.ts` (service role).
- Migration `supabase/migrations/0001_user_layer.sql` — **applied**.
- Tables created: `auth.users`, `public.users`, `public.user_profiles`. Trigger populates `users.name` from signup `name` metadata. Role defaults `BUYER`.
- Flow verified end-to-end: signup → email confirm → login → redirect.
- Email: Google Workspace custom SMTP (`info@skxnz.com`), confirmation emails send. No secrets committed.
- **Middleware** (`middleware.ts`) — refreshes Supabase session + rotates token on every request via `@supabase/ssr`. **Route protection is stubbed/commented out** — no route actually gated yet (add `getClaims()` checks to guard `/account`, `/seller`, `/admin`).
- Auth UI wiring: `components/auth/auth-provider.tsx`, `auth-card.tsx`, OAuth callback `app/auth/callback/route.ts`, plus `demo-role-provider.tsx` for demo role switching.

## 🟡 Prepared but NOT applied / NOT wired
### Catalog DB (Slice 2A)
- `supabase/migrations/0002_catalog_layer.sql` — brands, categories, products, product_variants, product_images; `product_status` enum; indexes; updated_at triggers; **RLS on all 5 tables** (public read active; sellers manage own; admin full).
- `supabase/seeds/0002_catalog_seed.sql` — idempotent demo brands/categories/products.
- `supabase/verification/0002_catalog_verify.sql` — checks tables, RLS, policies, seed counts.
- `lib/catalog/{types,queries,mappers}.ts` — server-only query layer; fails safe (returns empty) if tables absent.
- **Status:** not run in Supabase; no UI wired. Homepage still on static data.

## ⚠️ Mixed / needs decision
- **Prisma** present (`lib/prisma.ts` + `@prisma/client`) alongside Supabase. Catalog targets Supabase SQL, not Prisma. Decide: one ORM/source of truth. `lib/data/*` are demo/mock data modules, not real DB reads.

## ❌ Not built
- **Payments** — no Razorpay code, no order/payment tables, no webhook. Checkout is UI mockup.
- **Shipping** — no Shiprocket integration, no shipment status.
- **Real AI backend** — `app/api/ai/*` routes call local rule-based `src/lib/ai/service.ts`. Provider abstraction (`src/lib/ai/provider.ts`) supports an external provider but it is wired for **OpenAI** (`AI_PROVIDER=openai` + `OPENAI_API_KEY`), default `local`. **No Anthropic/Claude API call** — mismatch with project's stated Claude API goal; decide provider direction.
- **Orders/cart/wishlist persistence** — demo data only.
- **Admin/account auth gating** — middleware refreshes session but does not redirect; admin/seller/account pages not protected by real role checks.

## Hard rules reminder (enforce when building)
- RLS ON every table with explicit policies.
- Payments server-authoritative; amounts from DB; mark paid only from signature-verified Razorpay webhook.
- No raw card data (last4 + issuer only; tokenization via Razorpay).
- Money = integer paise. Secrets server-side. Validate input with zod. Auth on every route.
- Every table: `created_at`, `updated_at`, owner column.
