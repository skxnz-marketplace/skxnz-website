---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 10 — CLAUDE AGENT OPERATING SYSTEM

How to run multiple Claude Code agents safely. Written for a non-technical owner.

## The golden rules
1. **One job per agent.** Each agent has one role (see `06_AGENT_TASK_BOARD.md`).
2. **Never edit the same file at the same time.** Two agents touching one file = corruption. Split by folder ownership.
3. **Use branches OR clear file ownership.** Safest: one branch per agent, or agents work in different folders.
4. **Every agent writes a report** when done (files changed + what + bugs).
5. **One master agent reviews** all reports before anything is committed.
6. **No commit/push without owner approval.**

## File ownership map (who edits what)
- **Frontend Polisher:** `app/**` (UI), `components/**`, `src/components/**`, `app/globals.css`, `tailwind.config.ts`.
- **Backend Inspector:** `supabase/**`, `lib/supabase/**`, `lib/catalog/**`, `lib/data/**`, `app/api/**`.
- **Reporter & Main Planner:** `SKXNZ_COMMAND_VAULT/**`, `PROGRESS.md`.
- Overlap area (e.g. `app/page.tsx` when wiring data): Main Planner sequences — backend finishes first, then frontend.

## Beginner-friendly step-by-step (one work session)
1. Open a terminal in the project folder.
2. Tell **Main Planner**: "Read the vault and give me today's plan." (or open `02_TODAY_EXECUTION_PLAN.md`).
3. Pick ONE task. Assign it to the right agent with a clear prompt (use `09_CODEX_PROMPTS.md` or the "Next Claude prompt" in `08_DAILY_REPORT.md`).
4. Let that agent finish and show you the files it changed.
5. Ask **Reporter** to log it in `08_DAILY_REPORT.md` and update `07_KNOWN_BUGS.md`.
6. Ask **Main Planner** to review the change.
7. If good, YOU say "commit" — then it commits + pushes. If not, send it back.
8. Repeat with the next single task.

## Running agents in parallel (only when safe)
- OK to run Frontend Polisher + Backend Inspector at once — different folders.
- NOT OK to run two agents both editing `components/` or both editing `supabase/`.
- If unsure, run them one after another.

## Branch strategy (simple)
- Current work branch: `local-polish-auth-ui`.
- For a big separate feature, make a new branch: `git checkout -b feature/<name>`.
- Keep `main` always deployable (Vercel auto-deploys from it).

## Safety reminders (from CLAUDE.md — never break)
- RLS on every Supabase table. Secrets server-side only.
- Payments server-authoritative; no raw card data; money in paise.
- No fake claims, no copying brands, no overpromising unbuilt features.
