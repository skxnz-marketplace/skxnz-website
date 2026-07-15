# D8-A Build, Route, and Vercel Readiness

D8-A began from `launch-war-july30` at `bc7b2ae` in the isolated `codex/d8a-build-readiness` worktree. It fixed deterministic Windows build-script syntax, a Server Action export violation, external font-fetch coupling, and missing metadata-route coverage. It does not claim a production or Vercel build passed.

Validation: `pnpm.cmd run test:commerce` passes 113/113 tests; `pnpm.cmd exec tsc --noEmit --incremental false` passes; targeted ESLint has no errors (the test file is ignored by the repository ESLint pattern); and `git diff --check` passes. The local production build reaches Next compilation but remains blocked by the Windows-only WASM SWC dependency set; native Vercel/Linux build evidence is still required. The route matrix, Vercel/env notes, metadata audit, dead-code gate, and browser checklist give the exact QA path.

Critical and High blockers remain: canonical 0002 catalog baseline unrecovered; disposable Supabase QA incomplete; payments/refunds/delivery unavailable; and authenticated production browser QA plus native build verification still required. No push, deployment, live SQL, or secret access occurred.
