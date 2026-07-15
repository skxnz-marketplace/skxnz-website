# Vercel / Linux build readiness gate

## Verified repository assumptions

- `package.json` declares `pnpm@10.33.0`; use Corepack or equivalent Vercel pnpm support.
- The build command is `pnpm run build`, which runs `scripts/build-next.mjs` then the existing vendor-chunk check.
- `scripts/build-next.mjs` uses the Windows WASM fallback only on Windows. A Linux Vercel builder is not forced onto that fallback.
- `next.config.ts` enables React strict mode and contains no deployment override.
- Metadata, sitemap, robots, and manifest use `https://skxnz.com` only as a safe fallback/canonical origin; they make no live AI, payment, delivery, or refund claim.
- No Vercel configuration file is present. That is not itself an error; the operator must set project build/install settings explicitly before a deployment attempt.

## Environment boundary

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public names. `SUPABASE_SECRET_KEY`, database URLs, payment-provider values, storage credentials, and AI-provider keys remain server-only. `.env.example` was reviewed as a placeholder template only; no `.env` file or value was opened in D9-A.

## Required operator gate

Before any deployment, configure the approved public origin and server-only variables in Vercel, select a supported Node LTS compatible with Next 15 and pnpm 10, run a native Linux build, and inspect the actual build log. Do not promote the project on the basis of the Windows/WASM result. This gate is **RED** until a native build succeeds and authenticated route smoke is complete.
