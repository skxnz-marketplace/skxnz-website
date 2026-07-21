# D10-A localhost smoke results

## Runtime

- URL: `http://localhost:3002`
- Command: `pnpm.cmd exec next dev -p 3002`
- Server: Next.js 15.5.15 reported ready.
- Browser automation: blocked by Chrome URL-detection policy and not retried.
- Fallback: direct HTTP GET status/redirect checks using `curl.exe`.

## Result

The root request returned HTTP 500. The safe response classification and server log both identify the same cause: middleware calls `createServerClient` without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` available in the isolated worktree. All 22 requested route checks, plus one source-backed product path and dynamic brand/category paths, returned HTTP 500 with no redirect.

No environment file was opened and no value was printed. D10-A did not copy credentials, invent test credentials, weaken middleware, or add a runtime fallback. This result proves the server process starts but does not prove any page render, protected redirect, live Supabase access, console cleanliness, or visual behavior.

## Classification

- Dev server start: **PASS**
- Configured application runtime: **BLOCKED**
- Public route rendering: **BLOCKED**
- Protected redirect behavior: **BLOCKED at runtime; source contract inspected only**
- Visual/mobile/browser QA: **BLOCKED**
- Deterministic route-crashing source bug: **not established**; the observed failure is missing required public runtime configuration.
