---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 02 — TODAY EXECUTION PLAN (2026-07-02)

Small, ordered, executable steps. Do top to bottom. Check the box when done.

## Priority 1 — Obsidian + Claude agent setup
- [x] Create `SKXNZ_COMMAND_VAULT/` with all 10 command files.
- [ ] Open the folder in Obsidian ("Open folder as vault") to browse it nicely.
- [ ] Read `06_AGENT_TASK_BOARD.md` and `10_CLAUDE_AGENT_SYSTEM.md` once so you know how the agents work.

## Priority 2 — Frontend polish (branch: local-polish-auth-ui)
- [ ] Confirm header is solid dark maroon (not glassy). See `--skxnz-maroon-glass` in `app/globals.css` — replace glassy header bg with solid `--skxnz-maroon`.
- [ ] Tighten homepage: reduce empty gaps, smaller/sharper text.
- [ ] Product cards: denser grid, compact spacing (`components/sections/product-card.tsx`, `components/shared/product-grid.tsx`).
- [ ] Brand bar: use brand logos not plain text (`src/components/brands/top-brands-toolbar.tsx`).
- [ ] Category strip: fix clipping (`components/home/category-strip.tsx`).
- [ ] Remove unnecessary buttons across homepage.

## Priority 3 — Backend / auth / Supabase continuation
- [ ] Apply catalog in Supabase SQL Editor, in order:
  1. `supabase/migrations/0002_catalog_layer.sql`
  2. `supabase/seeds/0002_catalog_seed.sql`
  3. `supabase/verification/0002_catalog_verify.sql` (check all pass)
- [ ] Confirm RLS enabled on all 5 catalog tables (verify script checks this).
- [ ] Wire homepage/shop to `lib/catalog/queries.ts` with fallback to `lib/home-data.ts`.

## Priority 4 — Clean prompts for Codex + Claude
- [ ] Use `09_CODEX_PROMPTS.md` for Codex tasks.
- [ ] Use `06_AGENT_TASK_BOARD.md` to assign each Claude agent.

## End of day
- [ ] Fill `08_DAILY_REPORT.md`.
- [ ] Update `PROGRESS.md` (Done + Next up).
- [ ] Commit + push ONLY after your approval.
