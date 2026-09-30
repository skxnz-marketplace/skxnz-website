# D9-A Production Build Proof and Launch Gate

D9-A began from `launch-war-july30` at `3cc1cd3` in the isolated `codex/d9a-build-proof` worktree. It performed no deployment, push, SQL, migration, RPC, RLS, or secret access.

The local Windows production build was attempted with `pnpm.cmd run build` and did **not** pass. It reaches Next.js 15.5.15 compilation, then the Windows-only `@next/swc-wasm-nodejs` dependency fails to support the transform required by `lib/supabase/server.ts` (`next/headers`) in the seller action import trace. The worktree has no native `@next/swc-win32-x64-msvc` package. This is a local compiler/dependency limitation, not proof of a Vercel/Linux build.

Application checks pass: commerce tests 119/119, TypeScript no-emit, and ESLint with zero errors (three existing unused-variable warnings). D9-A adds build-proof, Vercel, route-smoke, launch-gate, operator-next-step, and buyer-UI-debt documentation plus source-level regressions that prevent the reports from claiming a passing production build.

Launch remains blocked by the unrecovered canonical `0002_catalog_layer.sql`, incomplete disposable Supabase QA, unavailable payment/refund/delivery integrations, missing native Vercel/Linux build evidence, pending authenticated browser/mobile QA, and buyer-facing visual-quality debt. See `docs/launch-war/day9/build-proof/` for exact evidence and operator gates.
