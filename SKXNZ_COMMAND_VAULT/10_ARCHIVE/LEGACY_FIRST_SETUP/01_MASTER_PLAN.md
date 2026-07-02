---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 01 — SKXNZ MASTER PLAN

_Last updated: 2026-07-02. Source of truth for what SKXNZ is and what is actually built._

## What SKXNZ is
SKXNZ ("WEAR THE SIGNAL") is an AI-powered, multi-seller futurewear fashion marketplace by Vivaan Poddar Companies. Domain: **skxnz.com**. Ultra-premium, futuristic, Gen Z aesthetic — obsidian black, midnight navy, deep maroon, electric cyan, ultraviolet, sonic magenta, liquid silver, pearl white.

Business model: sellers list fashion products, buyers browse and buy, AI helps both sides (styling, product copy, video prompts), platform handles orders/payments/shipping/returns/support.

## The full product ecosystem (target vision)
1. **Buyer website** — browse, search, product pages, cart, checkout, account, orders, wishlist.
2. **Buyer app** — mobile version of buyer website (NOT started).
3. **Seller dashboard (web)** — apply, list products, manage inventory/orders, analytics, AI tools.
4. **Seller app** — mobile seller tools (NOT started).
5. **Rider/delivery app** — pickup, delivery, tracking (NOT started).
6. **Admin back office** — users, sellers, products, orders, returns, support, content, analytics, community.

## AI capabilities (target vision)
- **AI Stylist / Outfit Builder** — suggests outfits to buyers.
- **AI Try-On** — virtual try-on (roadmap only, not built).
- **AI Seller Tools** — product title generator, description generator, product check.
- **AI Product Video Prompt Generator** — generates video prompt text.
- **AI Buyer Assistant** — floating chat assistant.
- Delivery tracking, returns, support, analytics — platform features.

---

## BUILD STATUS (verified from code, 2026-07-02)

### ✅ Built (real, working)
- **Frontend page shells** for buyer, seller, admin, and AI sections — ~281 source files, ~75 page routes exist and render.
- **Supabase Auth** — real signup, email confirmation, login, redirect. Creates `auth.users`, `public.users`, `public.user_profiles`; role saves as `BUYER`. Migration `0001_user_layer.sql` applied. Clients in `lib/supabase/{client,server,admin}.ts`.
- **Google Workspace email** — `info@`, `support@`, `no-reply@skxnz.com` working; Supabase custom SMTP sends confirmation emails.
- **Homepage + buyer UI polish** — clean white background, tighter spacing, compact cards (in progress on branch `local-polish-auth-ui`).
- **Local AI service** — rule-based assistant/stylist/title/description/video-prompt via `src/lib/ai/service.ts` + API routes under `app/api/ai/*`. Works locally. Provider abstraction (`src/lib/ai/provider.ts`) can switch to an **external provider — currently wired for OpenAI** (`AI_PROVIDER=openai` + `OPENAI_API_KEY`), default `local`. **NOT connected to Claude/Anthropic API** despite project's Claude API goal.

### 🟡 Partially built
- **Catalog / product database** — schema + seed + query layer written (`supabase/migrations/0002_catalog_layer.sql`, `supabase/seeds/`, `lib/catalog/`) but **NOT yet applied in Supabase** and **not wired to UI**. Homepage still uses static `lib/home-data.ts` + `src/data/*`.
- **Seller flows** — pages exist (apply, dashboard, inventory, orders, products, tools) but run on demo/mock data (`lib/data/*`), no real DB writes.
- **Admin back office** — full page set exists but on mock data, no real auth-gated admin.
- **Buyer account/orders/wishlist/cart** — UI present, demo data only (`components/account/*-demo.tsx`).

### ❌ Not built yet
- **Payments** — no Razorpay code anywhere. No server-authoritative order/payment flow.
- **Shipping** — no Shiprocket integration.
- **Real Claude API** — AI is local/rule-based; external scaffold targets OpenAI, not Anthropic. No Claude SDK call anywhere.
- **Real orders/cart/checkout persistence** — checkout pages are UI mockups.
- **Buyer app, seller app, rider app** — none exist (web only).
- **AI Try-On** — roadmap card only.
- **Returns / support / analytics** as real backend — UI only.

---

## Strategic build order (recommended)
1. Finish buyer UI polish (current branch).
2. Apply catalog DB (0002) + wire homepage/shop to real product data.
3. Real cart + wishlist persistence (Supabase, RLS).
4. Real seller product create (write to catalog, RLS).
5. Checkout + Razorpay (server-authoritative, webhook-verified).
6. Shiprocket shipping + order status.
7. Connect real Claude API for AI tools.
8. Admin back office on real data.
9. Mobile apps + rider app.

## Legal / integrity rules (never break)
- No copying existing brands. No fake claims. No overpromising unbuilt features.
- RLS on every Supabase table. No raw card data. Money in integer paise. Secrets server-side only.
