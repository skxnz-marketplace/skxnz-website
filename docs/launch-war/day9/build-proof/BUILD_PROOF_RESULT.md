# D9-A local production build proof

## Commands and results

| Command | Result |
| --- | --- |
| `pnpm.cmd run test:commerce` | PASS, 119/119 application-level mocked tests |
| `pnpm.cmd exec tsc --noEmit --incremental false` | PASS |
| `pnpm.cmd exec eslint app components lib scripts` | 0 errors; 3 existing unused-variable warnings |
| `pnpm.cmd run build` | BLOCKED locally; exit 1 |

## Exact build evidence

`pnpm.cmd run build` invokes `node scripts/build-next.mjs && node scripts/fix-next-vendor-chunks.mjs`. Next.js 15.5.15 begins an optimized production build, then reports that the WASM SWC transform does not support the required plugin and fails at `lib/supabase/server.ts` importing `next/headers`. The import trace is `lib/supabase/server.ts` -> `lib/orders/read-seller-orders.ts` -> `components/seller/seller-line-actions.tsx`.

The dependency tree available to this Windows worktree contains `@next/swc-wasm-nodejs` and lacks `@next/swc-win32-x64-msvc`. `scripts/build-next.mjs` deliberately enables the WASM fallback only on Windows. No source rewrite is justified: TypeScript is clean and the same server-component boundary is valid for native Next SWC. D9-A does not claim that Vercel has built or deployed this revision.

## Classification

This is category **B — local Windows dependency/SWC issue**, not a deterministic application source issue, missing runtime environment value, or font/network dependency. The D8-A fixes for POSIX inline environment syntax, Server Action exports, and Google-font network fetching remain present.
