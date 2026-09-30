# Architecture (one page)

```
Browser ──► Vercel (Next.js 15 App Router, region bom1)
              │  middleware.ts ── Supabase SSR session; gates /account /orders /wishlist /admin /seller
              │  Server Components + Server Actions (lib/<domain>/*-actions.ts, "use server")
              │     ├─ lib/supabase/server.ts ....... per-request client (anon key + user cookies, RLS applies)
              │     ├─ lib/supabase/public-catalog.ts cookie-less read client for cacheable catalogue reads
              │     └─ lib/supabase/admin.ts ........ service-role client (server only, bypasses RLS)
              │  Route handlers: app/api/{search, ai, ai-assistant}
              ▼
          Supabase project "skxnz": Postgres (RLS on every table), Auth, Storage (product-images)
```

- **Rendering:** mostly server-rendered; the catalogue is read through Supabase with RLS. Some
  features (site search, AI assistant/stylist) still read static `src/data/` (see SOURCE_OF_TRUTH).
- **Writes:** Server Actions validate input (zod on the community actions), apply
  `lib/security/rate-limit` policies, and rely on RLS plus DB functions for atomic commerce steps
  (order intent, returns, fulfilment; see migrations 0008–0011, 0016). Retries are read-only
  (`lib/net/fetch-with-retry.ts`). Writes need idempotency keys, not retries.
- **Bot protection:** Cloudflare Turnstile on auth forms (`lib/security/turnstile.ts`).
- **Consent and analytics:** `components/consent/*`. GA4 loads only after analytics consent and
  only on skxnz.com. Vercel Web Analytics is always on.
- **Payments:** Razorpay planned (see CLAUDE.md rules). Live payments are not enabled.
- **AI:** `AI_PROVIDER=local` by default (rule-based, no API key). An OpenAI-compatible provider is optional.
- **Hosting and deploy:** Vercel project `skxnz-website`. See DEPLOYMENT.md (production branch unconfirmed).
