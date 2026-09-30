# SKXNZ web

The buyer-facing website and admin/seller back office for **SKXNZ** ("Wear The Signal"),
the AI-powered futurewear marketplace by Vivaan Poddar Companies. Live at https://skxnz.com.

Next.js 15 (App Router) + TypeScript + Tailwind, backed by Supabase (Postgres, Auth, Storage),
hosted on Vercel.

## Quick start

Prerequisites: Node 20+ (developed on Node 24), pnpm 10.33 (via `corepack enable`), Git. Full walkthrough:
[docs/engineering/LOCAL_SETUP.md](docs/engineering/LOCAL_SETUP.md).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local   # then fill in the Supabase + Turnstile values
pnpm dev                      # http://localhost:3000
```

## Checks (run all before committing)

| Check | Command |
|---|---|
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Commerce + rate-limit + retry tests | `pnpm test:commerce` |
| Auth + consent tests | `pnpm test:auth` |
| Production build | `pnpm build` |

## Where things are

- **Canonical branch:** `integrate/recover-missing-work`. The branch Vercel deploys to production
  is **not confirmed** — read [DEPLOYMENT.md](docs/engineering/DEPLOYMENT.md) before pushing anything.
- **What lives where:** [REPOSITORY_MAP.md](docs/engineering/REPOSITORY_MAP.md)
- **Which data/config is authoritative:** [SOURCE_OF_TRUTH.md](docs/engineering/SOURCE_OF_TRUTH.md)
- **System overview:** [ARCHITECTURE.md](docs/engineering/ARCHITECTURE.md)
- **Task worktrees:** [WORKTREES.md](docs/engineering/WORKTREES.md)
- **Current status / history:** [PROGRESS.md](PROGRESS.md) (newest first)
- **Agent rules:** [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md)
