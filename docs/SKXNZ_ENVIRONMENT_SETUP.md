# SKXNZ Environment Setup

Status: Private beta prep. Draft for internal review.

## Current App Reality

SKXNZ is a Next.js App Router web MVP. The current buyer, seller, admin,
community, AI assistant, cart, wishlist, and checkout flows remain demo/local or
static-data foundations unless a future phase explicitly connects production
services.

Do not add real secret values to this repository. Use `.env.example` only as a
template and put real values in local `.env.local` files or deployment-provider
secret settings.

## Required Local Setup

1. Install dependencies with the package manager declared in `package.json`.
2. Copy `.env.example` to `.env.local`.
3. Leave optional service keys blank unless that service is intentionally being
   connected in a safe private branch.
4. Run `npm run lint`, `npm run typecheck`, and `npm run build` before sharing a
   private beta build.

## App URL Variables

- `NEXT_PUBLIC_APP_NAME`: public app name. Use `SKXNZ`.
- `NEXT_PUBLIC_APP_URL`: canonical private beta URL used for metadata.
- `NEXT_PUBLIC_SITE_URL`: fallback canonical site URL.
- `NEXT_PUBLIC_PRIVATE_BETA_MODE`: set to `true` for private beta builds.
- `NEXT_PUBLIC_WAITLIST_URL`: defaults to `/waitlist`.
- `NEXT_PUBLIC_SELLER_APPLICATION_URL`: defaults to `/sell`.

Use a private beta URL placeholder until Vivaan Poddar Companies approves a real
private deployment target. Do not point public marketing traffic at the build
until launch approval is complete.

## Database Variables

- `DATABASE_URL`: PostgreSQL connection string for Prisma.
- `DIRECT_URL`: optional direct connection for hosted Postgres migrations.

Current private beta can run without production database writes. Enable these
only when the database, migrations, backup plan, and private data handling rules
are ready.

## Auth Variables

Future auth providers may use:

- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not store raw passwords in SKXNZ. Production accounts must use a trusted auth
provider and role-based access before any public admin/seller launch.

## Storage Variables

Future storage may use:

- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`

Do not store personal photos, seller documents, or community uploads until
consent, moderation, retention, and deletion rules are ready.

## AI Variables

- `AI_PROVIDER`: keep `local` unless a server-side AI provider is configured.
- `OPENAI_MODEL`: model name for future server-side AI.
- `OPENAI_BASE_URL`: optional provider base URL.
- `OPENAI_API_KEY`: server-side secret only.

AI assistant recommendations must stay catalog-bound and beta-safe. Do not claim
AI try-on or AI product video generation is live.

## Payment Variables

Future payment providers may use:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Do not add live payment keys for private beta. Current checkout must remain
clearly labeled as demo/internal until payments, refunds, taxes, and order
operations are approved.

## Analytics And Monitoring Variables

Future private beta monitoring may use:

- `NEXT_PUBLIC_ANALYTICS_ID`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

Do not add external tracking without a privacy review and clear beta disclosure.

## Deployment Safety Rules

- Keep `.env` and `.env.local` out of git.
- Use provider secret storage for real keys.
- Do not expose server secrets with `NEXT_PUBLIC_`.
- Keep admin routes marked internal/demo until production auth exists.
- Keep legal/policy pages marked draft until legal review is complete.
- Keep checkout marked demo until live payments are intentionally connected.
