---
tags: [skxnz, backend, frontend]
---
# TECH MEMORY

Stack + verified technical facts.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS.
- Supabase — Postgres, Auth, Storage, Edge Functions.
- Hosting: Vercel (Mumbai / bom1). Deploy: push to GitHub → Vercel auto-deploy. Keep `main` deployable.
- Planned: Razorpay (payments), Shiprocket (shipping), Claude API (AI).

## Verified facts (read-only)
- Supabase clients: `lib/supabase/{client,server,admin}.ts`. Auth migration `0001_user_layer.sql` applied.
- `middleware.ts` refreshes session via `@supabase/ssr`; **route protection commented out** (no gating yet).
- Catalog: `supabase/migrations/0002_catalog_layer.sql` (RLS on 5 tables), seed + verify scripts, `lib/catalog/{types,queries,mappers}.ts`. Not applied.
- AI: `src/lib/ai/*` local engine; `provider.ts` external = **OpenAI** (`OPENAI_API_KEY`), default local.
- **Prisma present** (`lib/prisma.ts`) alongside Supabase → single-source-of-truth decision pending.

## Hard rules (never break when building later)
RLS on every table · secrets server-side · payments server-authoritative, webhook-verified · no raw card data (last4+issuer) · money in integer paise · zod validation + auth on every route · types generated from schema.

Related: [[PRODUCT_MEMORY]] · [[DECISION_LOG]] · [[SKXNZ_BACKEND_AUDITOR]]
