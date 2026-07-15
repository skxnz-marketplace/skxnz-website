# Vercel and environment readiness

Required public names are `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SECRET_KEY`, database URLs, payment secrets, storage keys, and provider keys must remain server-only.

`.env.example` is a template only. No environment file or value was opened in D8-A. `pnpm run build` now uses `scripts/build-next.mjs`, which invokes Next through Node rather than POSIX inline environment assignment. On Vercel/Linux it does not force the Windows WASM fallback, allowing Vercel's native SWC package to compile server actions.

Before any deployment, configure only approved values, confirm canonical `skxnz.com` URLs, and perform authenticated browser QA. This is not launch approval.
