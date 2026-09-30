# SKXNZ Launch War — Day 11-B: Build, Runtime & Production Readiness

- **Worktree:** `skxnz-codex-d11b-production-readiness`
- **Branch:** `codex/d11b-production-readiness`
- **Base:** `6532a4c` (matches expected HEAD)
- **Scope:** production hardening only. No UI redesign, no visual polish, no schema change, no new features.

---

## 1. Headline result

**The production build was failing at `6532a4c` and now passes.**

| Attempt | Command | Result |
| --- | --- | --- |
| 1 (baseline, before any change) | `pnpm.cmd run build` | **EXIT 1 — Failed to compile** |
| 2 (after the client/server boundary fix) | `pnpm.cmd run build` | **EXIT 0 — Compiled successfully** |
| 3 (after dead-code removal + error boundaries) | `pnpm.cmd run build` | **EXIT 0 — Compiled successfully in 2.1min** |

This is a real, reproduced, locally-proven green build on Windows. It is **not**
a claim that a Vercel/Linux deploy will succeed — see §7 for what remains
unverified.

---

## 2. The build blocker (true code failure, not environment)

Baseline build output, decisive line:

```
./lib/supabase/server.ts
  x You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.

Import trace for requested module:
./lib/supabase/server.ts
./lib/orders/read-seller-orders.ts
./components/seller/seller-line-actions.tsx
```

**Cause.** `components/seller/seller-line-actions.tsx` is a `"use client"`
component. It imported `NEXT_SELLER_FULFILMENT` and `describeSellerFulfilment`
— plain constants and a label helper — from `lib/orders/read-seller-orders.ts`.
That module is server-only: it imports `lib/supabase/server.ts`, which imports
`next/headers`. Because these were **value** imports (not type imports), the
server module was pulled into the client bundle graph and Next refused to
compile.

**Fix.** Extracted the pure vocabulary into a new dependency-free module,
`lib/orders/seller-fulfilment-vocabulary.ts` (no imports at all, by design).
`read-seller-orders.ts` now imports the type from there and re-exports the
constants so every existing server-side import keeps working unchanged;
`seller-line-actions.tsx` imports directly from the safe module. The fulfilment
ladder is still enforced server-side in
`lib/orders/seller-update-line-fulfilment.ts` and by the 0009 RPC — this change
moves display vocabulary only, never authority.

Classification: **true code failure.** Not Windows-specific, not SWC-specific,
not environment. It would fail identically on Vercel.

---

## 3. Client/server boundary sweep

After fixing the reported error I swept the whole codebase rather than
rebuilding blindly, because the compiler stops at the first violation.

A static scan walked every `"use client"` file, resolved its `@/…` imports, and
transitively marked any module reaching `next/headers` or
`@/lib/supabase/server` (excluding `"use server"` action files, which are a
legitimate client→server edge). It reported five candidates. Four proved to be
**false positives** — they use `import type`, which TypeScript erases, so no
runtime edge exists:

| Client component | Imports | Verdict |
| --- | --- | --- |
| `components/seller/seller-line-actions.tsx` | value import of fulfilment constants | **REAL — fixed** |
| `components/admin/admin-order-status-panel.tsx` | `import type { BuyerOrderStatus }`; value import of `admin-order-transitions` (which itself only `import type`s) | safe |
| `components/checkout/place-draft-order.tsx` | `import type { BuyerAddressOption }` | safe |
| `components/orders/order-return-panel.tsx` | `import type { BuyerOrderItem, BuyerOrderStatus, OrderReturnRequestSummary }` | safe |

The successful build confirms the sweep: one real violation, now zero.

---

## 4. Error boundaries (added)

The app had **no `error.tsx` and no `global-error.tsx` anywhere** — only
`app/not-found.tsx`. Any uncaught render error in production therefore fell
through to Next's built-in unbranded error screen, with no way back into the
site.

Added two boundaries:

- **`app/error.tsx`** — route-level. Branded, logs the real error to the server
  console, surfaces only `error.digest` to the buyer (never a stack), offers
  `reset()` and a link back to `/shop`. Copy states plainly that nothing was
  charged or submitted — true, since payment is not connected.
- **`app/global-error.tsx`** — last resort, catches root-layout failures.
  Renders its own `<html>`/`<body>` and uses **inline styles only, with zero app
  imports**, deliberately: the design system or global CSS could be exactly what
  failed, so depending on them would defeat the boundary.

Confirmed in the build manifest: `/_not-found` is prerendered, and both new
boundaries compile into the route tree.

### Existing graceful-degradation paths (audited, already correct, unchanged)

| Failure | Handling |
| --- | --- |
| Supabase unavailable / table missing | `lib/catalog/queries.ts` traps every query, detects `42P01`, returns empty results instead of throwing — pages still render. |
| Missing product | PDP falls back to local seed data, then renders a truthful "Product not found." empty state. |
| Missing brand | `BrandPageShell` renders "Brand not found." with a route back to `/brands`. |
| Live lookup timeout | PDP races the query against a 2.5s `AbortController` timeout and falls back. |
| Empty catalog | Every grid routes through `ProductGrid` → `EmptyState`. |
| Missing images | `SafeImage`: classify src → local fallback → styled `role="img"` placeholder. Never a broken-image icon, never a crash on a bad remote URL. |
| `NOT_WIRED` (0009/0010/0011 draft migrations absent) | Server actions detect `42P01`/`42703` and report read-only state rather than faking a transition. |

---

## 5. Runtime & environment audit

- **No client component reads `process.env`.** Verified by scanning every
  `"use client"` file — zero hits.
- **Every referenced env var is documented.** All 12 keys referenced across
  `app/`, `lib/`, `components/`, `src/`, `middleware.ts`, `scripts/`, `prisma/`
  are present in `.env.example`. No undocumented variable.
- **Service-role key is contained.** `SUPABASE_SECRET_KEY` appears in exactly
  one file, `lib/supabase/admin.ts`. That module is imported by exactly one
  consumer, `lib/support/admin-support-actions.ts`, which is `"use server"`.
  It never reaches the browser. No secret was opened or printed during this work.
- **Edge runtime.** `middleware.ts` is the only edge-adjacent surface; it uses
  `@supabase/ssr` + `NextResponse` only, with no Node built-ins. Built clean at
  91 kB.
- **`next.config.ts` is minimal** (`reactStrictMode` only). Note that with no
  `images.remotePatterns` configured, remote product images must stay
  `unoptimized` — which `SafeImage` already handles deliberately.

### Finding not fixed (deliberate, with reason)

`lib/supabase/admin.ts` **throws at module-evaluation time** if
`NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SECRET_KEY` is absent:

```ts
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase admin client is not configured.")
}
```

On an environment missing the secret, importing this module crashes immediately
rather than degrading to the project's usual `NOT_WIRED` contract. A lazy
`getSupabaseAdmin()` factory would be the correct hardening.

**Not changed this session** because `tests/mocks/supabase-admin.cjs` mocks the
module's current shape (`export const supabaseAdmin`) and three separate tests
assert on the literal string `supabaseAdmin` in other modules to guard against
non-atomic service-role fallbacks. Changing the export shape means editing that
mock and those guards — real regression risk against the admin atomicity
boundary D4-B established, for a hazard that only fires in an environment where
the admin console is non-functional anyway. Recorded as debt (§7).

---

## 6. Dead code removed

No `next/dynamic` and no dynamic `import()` exist anywhere in the codebase, so
static reference analysis is **complete and authoritative** — nothing can be
referenced by a path the scanner cannot see.

A scan found 33 modules that no route imports. Each was then re-checked by
basename against `app/`, `components/`, `lib/`, `src/`, `tests/`, `scripts/`,
and `prisma/`. **20 had zero references anywhere** and were removed:

```
components/account/order-history-demo.tsx
components/auth/demo-login-panel.tsx
components/buyer/final-homepage-experience.tsx
components/buyer/home-category-grid.tsx
components/buyer/home-hero-carousel.tsx
components/buyer/home-limited-drops-banner.tsx
components/buyer/home-shop-by-brand-section.tsx
components/buyer/home-top-brands-toolbar.tsx
components/layout/site-footer.tsx
components/returns/return-request-workspace.tsx
components/sections/admin-metric-card.tsx
components/sections/feature-strip.tsx
components/sections/metric-card.tsx
components/seller/seller-onboarding-status-card.tsx
components/seller/seller-product-upload-demo.tsx
components/seller/seller-product-workspace.tsx
lib/ai/catalog-assistant.ts
lib/ai/catalog-query.ts
lib/saved/save-actions.ts
src/lib/ai/prompt-library.ts
```

The `components/buyer/home-*` set is the superseded pre-D10 homepage; the live
homepage renders `components/home/*`.

**13 orphans were deliberately KEPT** because they are referenced by test
assertions or are ambiguous — removing them would require rewriting tests,
which is not what a hardening sprint should do:
`app/actions/auth.ts`, `components/account/address-book.tsx`,
`components/ai/ai-stylist-demo.tsx`, `components/buyer/home-trending-grid.tsx`,
`components/community/community-feed.tsx`,
`components/forms/seller-application-form.tsx`,
`components/home/ai-stylist-banner.tsx`, `components/layout/site-header.tsx`,
`lib/data/cart.ts`, `lib/orders/order-intent.ts`, `lib/prisma.ts`,
`src/components/brands/top-brands-toolbar.tsx`, `src/data/searchIndex.ts`.

Build and full test suite were re-run after the deletions — both green.

---

## 7. Metadata route fix

`app/robots.ts` emitted a **relative** sitemap directive:

```ts
sitemap: "/sitemap.xml",
```

The robots.txt specification requires an **absolute** URL here; crawlers ignore
a relative one, so the sitemap was effectively undiscoverable. Both metadata
routes now resolve the origin through one shared helper,
`getSiteBaseUrl()` in `lib/site.ts` (`NEXT_PUBLIC_APP_URL` →
`NEXT_PUBLIC_SITE_URL` → `https://skxnz.com`), removing the duplicated
resolution that previously lived inline in `sitemap.ts`.

**One test changed.** `tests/commerce-actions.test.cjs` asserted the literal
relative string — it had encoded the bug as expected behaviour. The assertion
now verifies the absolute-URL construction and that both routes use the shared
helper. This is a test tracking a real fix, not a weakened guard: the
protected-path exclusions (`/account`, `/admin`, `/orders`, `/seller`) are
untouched and still pass.

---

## 8. Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run build` | **EXIT 0 — Compiled successfully in 2.1min** |
| `pnpm.cmd run test:commerce` | **129 pass / 0 fail** |
| `pnpm.cmd exec tsc --noEmit --incremental false` | **EXIT 0** |
| Targeted ESLint (8 changed/added files) | **EXIT 0** |
| `git diff --check` | clean |

Route output: 60+ routes compiled — static (`○`), SSG with
`generateStaticParams` (`●`, 15 product pages prerendered), and dynamic (`ƒ`).
Shared first-load JS 102 kB; middleware 91 kB.

The worktree had no `node_modules`; dependencies were made available via a
directory junction to the clean worktree's `node_modules` (the approach used on
earlier days). No install was run and the lockfile was not touched.

---

## 9. Environment notes and non-blocking warnings

These appear in the build output and are **not** failures:

- `⚠ experimental.useWasmBinary is not an option for supported platform win32/x64 and will be ignored.`
  Emitted twice. `scripts/build-next.mjs` sets `NEXT_TEST_WASM=1` on Windows;
  this box has a native SWC binary, so Next ignores the WASM request. Harmless
  here and irrelevant on Vercel (Linux, native SWC).
- `! Plugin is not supported with current @swc/core. Plugin transform will be skipped.`
  Surfaced inside the baseline failure trace. It is a warning from the WASM SWC
  path, not the cause — the `next/headers` boundary error was.
- `No .next/server/vendor-chunks directory found. Skipping chunk normalization.`
  `scripts/fix-next-vendor-chunks.mjs` is a no-op on this Next version. Dead
  build step, harmless; left in place rather than changing the build contract.

**Linux/Vercel differences — explicitly NOT verified.** This build ran on
Windows with a local `.env.local` present (copied in for the build and deleted
before commit). The following remain unproven and must not be claimed:
case-sensitive import paths (Linux is case-sensitive, Windows is not), Vercel's
own env-var population, and the `bom1` region deploy itself.

---

## 10. Remaining production debt

1. **`lib/supabase/admin.ts` throws at module init** when the service key is
   absent (§5). Should become a lazy factory; requires coordinated updates to
   `tests/mocks/supabase-admin.cjs` and three atomicity guards.
2. **Case-sensitivity is unverified.** A `import "@/Components/…"` style
   mismatch builds on Windows and fails on Vercel. A Linux/CI build is the only
   real proof.
3. **`scripts/fix-next-vendor-chunks.mjs` is a no-op** on Next 15.5.15. Confirm
   it is still needed before the next deploy, or drop it.
4. **13 orphaned modules remain** (§6), pinned in place by test assertions.
   A dedicated sweep should retire the tests and the modules together.
5. **No `loading.tsx` anywhere.** Dynamic routes (`/shop`, `/orders`, seller and
   admin areas) have no streaming fallback, so slow Supabase calls show nothing
   until the server responds.
6. **No error monitoring.** `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` exist in
   `.env.example` but nothing reads them; the new boundaries log to console only.
7. **`/search` is in the sitemap** but is a redirect-only route into
   `/shop?q=` — a wasted crawl entry.

---

## 11. Guarantees

- Worktree created at `6532a4c`; no push, no merge, no deployment.
- No SQL executed, no migration added or applied, no schema change.
- No feature added. Every change removed a blocker, removed proven-dead code,
  or added a failure boundary.
- No secret was opened, printed, or committed. A local `.env.local` was copied
  in so the production build could resolve Supabase env vars, and **deleted
  before commit**.
- **No unsupported production claim.** The green build is proven on Windows
  only; §9 and §10 state exactly what remains unverified.
