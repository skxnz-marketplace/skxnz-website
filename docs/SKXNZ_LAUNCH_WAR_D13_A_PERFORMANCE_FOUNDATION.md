# SKXNZ Launch War — Day 13-A: Performance Foundation & Latency Audit

- **Worktree:** `skxnz-codex-d13a-performance-foundation`
- **Branch:** `codex/d13a-performance-foundation`
- **Base:** `6532a4c`
- **Scope:** measure-first performance. No UI redesign, no features, no branding, no business-logic change. No push, no deploy, no SQL.

---

## 1. Measurement environment — and its limits

All numbers here come from `pnpm.cmd run build` (Next 15.5.15) on **Windows with
the WASM SWC fallback**. The task forbids claiming Vercel/Linux performance
unless directly proven, so this document does not. Bundle sizes are real and
comparable (same machine, same command, before vs after). Wall-clock build time
is **not** reported as a metric — it is dominated by warm/cold SWC-WASM state,
not by these changes.

No runtime latency, TTFB, or Core Web Vitals numbers are claimed. There is no
Supabase reachable from this machine (standing limitation from earlier days), so
live query timing could not be captured. The data-layer wins below are proven by
**query count** — a structural property of the code, provable without a live DB —
not by measured milliseconds.

---

## 2. Build had to be unblocked before anything could be measured

`6532a4c` does not build. `components/seller/seller-line-actions.tsx` (a client
component) value-imported fulfilment constants from
`lib/orders/read-seller-orders.ts`, which imports `next/headers` via
`lib/supabase/server.ts` — dragging a server module into the client graph:

```
x You're importing a component that needs "next/headers".
```

Ported the minimal D11-B fix: extracted the pure vocabulary into
`lib/orders/seller-fulfilment-vocabulary.ts` (no imports), re-exported it from
`read-seller-orders.ts`, pointed the client component at the safe module. This
is a prerequisite for producing any build artifact to measure, not a perf change
in itself. **Build now compiles, EXIT 0.**

---

## 3. Audit findings

| Area | Finding | Action |
| --- | --- | --- |
| RSC duplicate fetch | **PDP resolves the product twice per request** — `generateMetadata` and the page body each call `resolveProduct(id)`. Each call is up to two sequential Supabase lookups (slug then id) plus their relation fetches and a 2.5s timeout race. | **Fixed** — React `cache()` (§4) |
| RSC duplicate fetch | **Category page looks the category up twice per request** — `generateMetadata` and the body each call `getActiveCategoryBySlug(slug)`. | **Fixed** — React `cache()` (§4) |
| Request memoization | **Zero use of React `cache()` / `unstable_cache` anywhere** in the codebase before this. Every duplicate read within a render pass hit the DB again. | Introduced the pattern (§4) |
| Fonts | **Two `@font-face` families declared but never referenced** — `Bodoni Moda SC`, `Merriweather Sans`. No CSS var, Tailwind token, or class matches them. | **Removed** (§5) |
| Home | `HomePage` already parallelizes with `Promise.all([getActiveBrands, getActiveProducts])`. No metadata dupe. | No change |
| Shop / brand PDP | Single fetch each; brand page has no `generateMetadata` dupe. Relation fetches already `Promise.all`-batched inside `queries.ts` (no N+1). | No change |
| Bundles | Buyer routes 200–205 kB First Load, shared 102 kB. No duplicate packages found. | See §6 |
| Provider | `MarketplaceProvider` (1553 lines) mounts in the root layout on every route and its context value object + handlers are recreated each render (no `useCallback`). | **Not touched** — see §7 |

### Explicitly checked, NOT an N+1

`getActiveProductsWithRelations` and the by-slug/by-id product reads fetch the
base rows once, then batch brands + categories + variants + images with a single
`Promise.all` of `.in(...)` queries. That is the correct shape already; there is
no per-row relation loop to eliminate.

---

## 4. Fix: request-scoped fetch dedup (React `cache()`)

**PDP** — `resolveProduct` wrapped in `cache()`, keyed by `id`. The two callers
in one request (metadata + body) now share one promise: **product resolution
drops from 2 passes to 1 per request.** Each eliminated pass was up to 2
sequential Supabase round-trips plus relation batches plus a timeout race, so on
the live path this roughly halves the DB work and removes one full 2.5s
worst-case timeout window from the request.

**Category page** — `getActiveCategoryBySlug` wrapped in a `cache()`d local
`resolveCategoryBySlug`, used by both metadata and body: **category lookup drops
from 2 to 1 per request.**

**Why this is truthful and safe:** React `cache()` memoizes **only within a
single server render pass**. It never persists across requests, so it cannot
serve stale product or category data — the correctness contract is identical to
calling the function twice, the second call is just free. This is not ISR, not
edge cache, not `unstable_cache`; no cross-request caching is introduced or
claimed. Behaviour is unchanged, proven by the unchanged test suite (129/129).

---

## 5. Fix: dead font removal

Removed the `Bodoni Moda SC` and two `Merriweather Sans` `@font-face` blocks from
`globals.css`. Nothing referenced either family, so browsers never matched and
never downloaded them — `@font-face` is lazy, so this is **runtime-neutral**, not
a network win, and it is not claimed as one. What it does: removes misleading
dead CSS and flags the now-unreferenced TTFs under
`public/assets/fonts/{bodoni-moda-sc,merriweather-sans}` (~830 KB) as dead assets
safe to delete in a follow-up. The two fonts actually rendered — Source Sans 3
(body) and Syne (display) — are untouched.

---

## 6. Before vs after (bundle, same machine/command)

| Route | Baseline First Load | After | Δ |
| --- | --- | --- | --- |
| `/` | 120 kB | 120 kB | 0 |
| `/product/[id]` | 202 kB | 202 kB | 0 |
| `/categories/[slug]` | 200 kB | 200 kB | 0 |
| `/shop` | 205 kB | 205 kB | 0 |
| `/brands/[slug]` | 203 kB | 203 kB | 0 |
| Shared JS | 102 kB | 102 kB | 0 |

**Identical bundle sizes are the expected and correct result.** `cache()` is a
server-side render-time memo — it ships no client JS — so the client bundle must
not move. The zero delta is the proof there is **no client regression**; the win
is in per-request server query count (§4), which the bundle table cannot show.

---

## 7. Deliberately NOT changed (with reasons)

- **`MarketplaceProvider` re-render churn.** Its context value is a fresh object
  literal each render and its ~30 handlers are not `useCallback`'d, so every
  consumer re-renders on any provider state change. The correct fix — memoize the
  value and stabilize every handler — is a large, risky refactor of a 1553-line
  stateful provider, and the sprint guardrail is "no business-logic change unless
  required for performance." Memoizing the value alone, without stabilizing the
  handlers, achieves nothing (the deps change every render). Left as debt.
- **Provider mount writes 7 `localStorage` keys** (`JSON.stringify` of the full
  seed catalog/orders/returns/tickets/applications) on hydrate and on every state
  change. Wasteful, but these writes *are* the persistence feature; trimming them
  changes behaviour. Left as debt.
- **`getActiveProducts()` on the homepage is unbounded** — it fetches all active
  products to slice the top 6 trending and sort the top 4 by price. Adding a
  `.limit()` would change which products win the price sort, i.e. business
  behaviour. Left as debt for a query that returns a paginated + separately-ranked
  result instead.
- **`/product/[id]` cannot fully prerender** — it reads `cookies()` via the
  Supabase server client, so the build logs `Dynamic server usage: cookies`. This
  is pre-existing (present in the baseline build too) and structural to the
  auth-aware client; not introduced here.

---

## 8. Validation

| Check | Result |
| --- | --- |
| `pnpm.cmd run build` | **EXIT 0 — Compiled successfully** (was failing at `6532a4c`) |
| `pnpm.cmd run test:commerce` | **129 / 129 pass** |
| `pnpm.cmd exec tsc --noEmit --incremental false` | **EXIT 0** |
| Targeted ESLint (changed files) | **EXIT 0** |
| `git diff --check` | clean |
| Secret scan on changed files | clean |

Note: the ESLint step *inside* `next build` emits a plugin-resolution warning
(`Cannot find module '@next/eslint-plugin-next'`) caused by the node_modules
junction pointing at the sibling worktree — pre-existing environment noise, not a
code defect. The build compiled regardless, and the standalone `eslint` run on
the changed files passes cleanly.

---

## 9. Largest bottlenecks found / largest improvements

**Found:** PDP double product-resolve (biggest — full duplicate fetch + relations
+ timeout race, twice); category double lookup; no request memoization anywhere;
provider global re-render churn; dead fonts.

**Improved:** PDP product resolution 2→1 per request; category lookup 2→1 per
request; dead CSS removed and ~830 KB dead font assets flagged. All with zero
client-bundle change and zero behaviour change (129/129 tests hold).

---

## 10. Remaining bottlenecks / production blockers

1. **`MarketplaceProvider` re-render churn** (§7) — the largest remaining
   client-side cost; needs a handler-stabilization refactor.
2. **Provider serializes full seed arrays to `localStorage` on every mount** (§7).
3. **Unbounded homepage product query** (§7) — needs pagination + ranked query.
4. **No live latency baseline exists.** Every runtime claim is blocked until a
   Supabase-reachable environment can capture TTFB and query timing. Bundle sizes
   are the only directly-measured metric here.
5. **No `loading.tsx` / Suspense streaming** on dynamic routes — slow server
   fetches show nothing until the whole page resolves. Adding streaming boundaries
   is the next high-value latency win.
6. **`/product/[id]` is fully dynamic** (cookies) — cannot be statically cached;
   revisit if an anon read path is introduced.

---

## 11. Guarantees

- Worktree created at `6532a4c`; no push, no merge, no deploy.
- No SQL, no migrations, no schema change, no business-logic change.
- No secrets read, printed, or committed. Local `.env.local` used for the build
  was deleted before commit; `.next` build output removed.
- **No Vercel/Linux performance claimed.** Only same-machine bundle sizes and
  structural query-count reductions are asserted.
