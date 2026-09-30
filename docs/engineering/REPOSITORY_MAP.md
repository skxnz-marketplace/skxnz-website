# Repository map

Standard Next.js App Router layout. There are two code roots for historical reasons: root
`components/` + `lib/` (primary) and `src/` (older). New code goes in the primary root.

## Runtime code

| Path | Owns | New code? |
|---|---|---|
| `app/` | Routes, layouts, route handlers (`app/api/{ai,ai-assistant,search}`), `sitemap.ts`, `robots.ts`, `llms.txt/` | Yes: one folder per route |
| `components/<area>/` | UI grouped by product area: `buyer`, `home`, `catalog`, `checkout`, `account`, `orders`, `community`, `admin`, `seller`, `ai`, `auth`, `consent`, `layout`, `shared`, `ui`, `reactbits` (Prism etc.), … | Yes, in the matching area |
| `lib/<domain>/` | Server logic and data access: `supabase` (clients), `catalog`, `checkout`, `orders`, `returns`, `support`, `saved`, `community`, `auth`, `consent` (GA4 gate), `security` (Turnstile, rate limits), `net` (read-only retry), `data` (client state), `types` | Yes: server actions and queries go here, by domain |
| `middleware.ts` | Auth gate for `/account`, `/orders`, `/wishlist`, `/admin`, `/seller` | — |
| `src/lib/` | Older helpers still in use: asset map (`assets.ts`), site search, AI assistant/stylist engines | Avoid; extend `lib/` instead |
| `src/data/` | **Fallback/demo data** generated from the planning sheet (see `src/data/README.md`) | No: never add catalogue facts here |
| `src/components/` | One legacy area (`brands`) | No |
| `public/` | Static files the site serves (`assets/**`, icons, `hero-film.mp4`) | Only assets the site actually references |

Payments, logistics and AI integrations follow the same rule: server code in `lib/<domain>/`
(e.g. `lib/payments/` when it exists), UI in `components/<area>/`. No separate "backend" folder.

## Data and database

| Path | What |
|---|---|
| `supabase/migrations/` | **The** schema history (`NNNN_name.sql`), applied in order to the `skxnz` Supabase project |
| `supabase/verification/` | Read-only SQL checks paired with migrations (`NNNN_*_verify.sql`, `*_isolation.sql`) |
| `supabase/seeds/` | Seed SQL (catalogue seed for 0002) |
| `prisma/` | Legacy. Not used by the app; `pnpm install` still runs `prisma generate` |
| `project-data/` | June 2026 planning spreadsheets and processed JSON. Input to `src/data/`, not the catalogue |

## Tooling, tests, scripts

| Path | What |
|---|---|
| `tests/` | `node:test` suites (`*.test.cjs`) compiled via `tests/tsconfig.json`; run by `pnpm test:commerce` / `test:auth` |
| `scripts/build-next.mjs`, `fix-next-vendor-chunks.mjs` | Used by `pnpm build`. Active |
| `scripts/check-colors.mjs` | `pnpm check:colors`. Active |
| `scripts/import-sheet-data.py`, `export-backend-seed-data.py` | Planning-sheet importers (see `project-data/README.md`) |
| `scripts/skxnz-d1-readiness.{sh,ps1}` | One-time launch-war Day 1 readiness check. Historical |
| `.claude/agents`, `.claude/skills` | Shared agent definitions (tracked). `.claude/settings.local.json` is per-machine (ignored) |
| `SKXNZ_COMMAND_VAULT/` | Founder's Obsidian vault (planning, kanban). Not code; excluded from lint |
| `SKXNZ_SKILL_EXPORTS/` | Exported design/Obsidian skills for Claude.ai. Not code |

## Documentation

| Path | What |
|---|---|
| `README.md` | Start here |
| `PROGRESS.md` | Running status log, newest first. Update it every session |
| `CLAUDE.md`, `AGENTS.md` | Rules for coding agents |
| `PRODUCT.md` | Product and design brief |
| `docs/engineering/` | How the repo works (this folder) |
| `docs/*.md` | Current reference docs: setup, data plans, QA playbooks, UI, legal and negative rules |
| `docs/launch-war/` | Launch-war day artefacts (tests read `docs/launch-war/day9/build-proof/*`; don't move) |
| `docs/archive/` | Historical snapshots and sprint reports. Read-only history |
