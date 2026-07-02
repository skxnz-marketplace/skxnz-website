---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 06 — AGENT TASK BOARD

Five roles. Each has clear ownership so agents never collide. One master reviews before commit.

---

## 1. Claude Main Planner
- **Responsibility:** Read `PROGRESS.md` + this vault. Decide priorities, assign tasks, review all agent reports, approve before any commit/push.
- **Touch:** `SKXNZ_COMMAND_VAULT/*`, `PROGRESS.md`.
- **Don't touch:** app source code directly (delegate it).
- **Success:** clear daily plan, no two agents on same files, clean review before commit.

## 2. Claude Frontend Polisher
- **Responsibility:** UI polish per `05_UI_UX_RULEBOOK.md` — header, cards, grid, brand bar, category strip, typography, search UI.
- **Touch:** `app/**` (pages/layout/css), `components/**`, `src/components/**`, `tailwind.config.ts`, `app/globals.css`.
- **Don't touch:** `supabase/**`, `lib/supabase/**`, `lib/catalog/**`, auth logic, API routes.
- **Success:** matches rulebook; responsive; no console errors; screenshot proof.

## 3. Claude Backend Inspector
- **Responsibility:** Supabase schema, RLS, auth, catalog apply/wiring, future payments/shipping. Enforce hard rules.
- **Touch:** `supabase/**`, `lib/supabase/**`, `lib/catalog/**`, `lib/data/**`, API routes under `app/api/**`.
- **Don't touch:** homepage/component styling, `globals.css`, `tailwind.config.ts`.
- **Success:** RLS on every table; verify scripts pass; server-authoritative rules honored; types generated from schema.

## 4. Claude Obsidian Reporter
- **Responsibility:** Keep the vault current. Update status files, bugs, daily report after each work block.
- **Touch:** `SKXNZ_COMMAND_VAULT/*`, `PROGRESS.md`.
- **Don't touch:** any app source code.
- **Success:** vault always reflects real code state; no fake completion claims.

## 5. Codex Executor
- **Responsibility:** Execute the precise, scoped prompts from `09_CODEX_PROMPTS.md`. Mechanical implementation only.
- **Touch:** only files named in the given prompt.
- **Don't touch:** anything outside the prompt scope; never invent features.
- **Success:** does exactly what prompt says; reports files changed; nothing extra.

---

## Collision rule
Frontend Polisher and Backend Inspector must **never** edit the same file in the same session. If a task needs both (e.g. wiring catalog into homepage), Main Planner sequences it: backend first, then frontend.

## Report rule
Every agent writes a short report (files changed, what/why, bugs found) → Reporter logs it in `08_DAILY_REPORT.md` → Main Planner reviews → then commit.
