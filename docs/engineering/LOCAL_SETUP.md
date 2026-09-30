# Local setup (zero → running site)

## 1. Tools

- Git
- Node 20+ (the team machine uses Node 24)
- pnpm 10.33, pinned in `package.json` `packageManager`. Run `corepack enable` once; pnpm then
  matches the pin. pnpm is the **only** package manager: there is no `package-lock.json` or
  `yarn.lock`, and there shouldn't be.

## 2. Code

```bash
git clone https://github.com/skxnz-marketplace/skxnz-website.git skxnz-web
cd skxnz-web
git switch integrate/recover-missing-work   # canonical branch (see DEPLOYMENT.md)
pnpm install --frozen-lockfile              # also runs `prisma generate` (legacy, harmless)
```

## 3. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` (never commit it; every `.env*` except `.env.example` is ignored). Values
come from the founder or the Vercel/Supabase dashboards, never from chat or docs.

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything | Public (browser-safe) key |
| `SUPABASE_SECRET_KEY` | Admin/seller actions (`lib/supabase/admin.ts`) | **Server only.** Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Auth forms | Falls back to Cloudflare's test key locally |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Auth forms (server verify) | Falls back to Cloudflare's test secret locally |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` | Canonical URLs, sitemap, metadata | Default `https://skxnz.com`; don't point production at localhost |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_WAITLIST_URL` | Branding and waitlist link | Optional |
| `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL` | AI tools | Optional. `local` (default) needs no key |

Every other variable in `.env.example` (Stripe, Razorpay, Sentry, storage, `DATABASE_URL`,
`DIRECT_URL`, `NEXT_PUBLIC_ANALYTICS_ID`, `NEXT_PUBLIC_PRIVATE_BETA_MODE`,
`NEXT_PUBLIC_SELLER_APPLICATION_URL`, `OPENAI_BASE_URL`) is a **placeholder the code does not
read today**.

## 4. Run and check

```bash
pnpm dev             # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm test:commerce   # commerce, rate-limit and fetch-retry suites
pnpm test:auth       # auth-trust and consent/GA4 suites
pnpm build
```

Smoke-test `/`, `/shop`, a product page, `/cart`, `/checkout`, `/login`, `/ai`, `/ai/stylist`,
`/sitemap.xml`, `/robots.txt`, `/llms.txt`.

## 5. Before you change things

Read `PROGRESS.md` (newest first), `CLAUDE.md` (hard rules: RLS everywhere, integer paise,
server-authoritative payments, zod on inputs), and `docs/engineering/SOURCE_OF_TRUTH.md`.
Schema changes are new files in `supabase/migrations/`. Never edit an applied migration, and
never run migrations against production without founder approval.
