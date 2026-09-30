# SKXNZ Launch War — D13-B Frontend Performance Runtime

- **Worktree:** `.worktrees/d13b-performance-runtime`
- **Branch:** `codex/d13b-performance-runtime`
- **Base:** `launch-war-july30` at `6532a4c`
- **Scope:** Buyer runtime only. No UI, buyer-flow, ranking, backend, schema, migration, SQL, push, deploy, or secret change.

## Measurement limits

Local Windows production compilation plus emitted Next manifests. No Supabase-reachable browser runtime: no TTFB, hydration, Core Web Vitals, or live-query timing claimed.

Baseline `pnpm.cmd run build` stopped at an existing seller client/server import leak before route-size output. After repair, Next compiled in **52 seconds** and emitted chunks, then stopped at pre-existing `lib/prisma.ts` `PrismaClient` type error. No First Load before/after values are fabricated.

## Profile and fixes

| Area | Evidence | D13-B result |
| --- | --- | --- |
| Global AI | 935-line component rendered globally but returns nothing until mount. | Deferred into measured **23.3 kB** async chunk. |
| Discovery | 423-line desktop/mobile menu mounted while closed. | Deferred into measured **12.0 kB** async chunk; preloaded on menu intent. |
| Header search | CSS mounts desktop/mobile bars together; URL search could issue identical suggestions twice. | Visible surface only may memoize/fetch: duplicate request shape **2 to 1**. |
| Seller client graph | Client action imported `read-seller-orders`, pulling `next/headers`. | Pure display vocabulary restored; compile now reaches type checking. |
| RSC reads | D13-A cached PDP/category duplicate metadata/body resolves; catalog relations already batch with `.in(...)` plus `Promise.all`. | Preserved; no change needed. |
| Global state | `MarketplaceProvider`: 1,553 lines, 26 consumers. | Untouched: split risks buyer-state behaviour. D13-C target. |
| Images | 51 `Image`/`SafeImage` sites; priority limited to opening loader/PDP lead/legacy home. Unknown remote seller URLs intentionally bypass optimizer. | Audited; no unproven image change. |
| Scroll | No global scroll handler found. Existing motion uses transforms/native scrolling; assistant drag uses `requestAnimationFrame`. | No forced-layout fault proven. |

## Artifact proof

| Deferred module | Emitted chunk | Size |
| --- | --- | --- |
| Floating AI assistant | `static/chunks/1083.3ec180a23507051b.js` | **23.3 kB** |
| Discovery menu | `static/chunks/5758.03e87727f620ba28.js` | **12.0 kB** |

Chunks verified in `.next/react-loadable-manifest.json`. This proves code splitting, not browser-speed claims.

## Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run test:commerce` | **131/131 pass** |
| `pnpm.cmd run build` | Compiled in 52s; then blocked by existing Prisma type error and shared ESLint plugin resolution |
| `pnpm.cmd run typecheck` | Existing `lib/prisma.ts(1,10): Module '@prisma/client' has no exported member 'PrismaClient'` |
| Targeted ESLint | Environment-blocked: shared dependency set lacks `@next/eslint-plugin-next` |
| `git diff --check` | Pass |
| Secret scan | Pass |

## Remaining bottlenecks / D13-C

1. Split `MarketplaceProvider` into narrow read/write contexts only after render-count profiling in configured browser.
2. Repair generated Prisma client availability to obtain completed production route-size output.
3. Capture real browser marks and Supabase timings in configured runtime.
4. Allowlist trusted remote image hosts before enabling Next image optimization.

## Guarantees

- No push, deploy, SQL, migrations, backend/schema change, buyer-flow change, UI redesign, or fabricated performance metric.
