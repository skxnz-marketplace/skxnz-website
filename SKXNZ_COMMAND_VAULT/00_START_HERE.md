---
tags: [skxnz, daily-report]
---
# 00 — START HERE

SKXNZ Command Vault. Read this first, every day. This is the control room for planning, agents, skills, animation, reports. **App code is NOT touched from here yet — planning + infrastructure only.**

## How to use this vault
- Open folder in Obsidian: "Open folder as vault".
- Everything is Markdown + wikilinks. Click links to jump.
- Navigate from [[MASTER_INDEX]] or [[MASTER_MAP]].

## First action every day
1. Open [[DAILY_COMMAND]] → run the "Morning startup".
2. Read [[CURRENT_STATUS]] and [[NEXT_ACTIONS]].
3. Pick ONE task. Assign to the right Claude agent (see [[AGENT_TASK_BOARD]]).

## How Claude updates reports
- After each work block, Claude fills a report from [[07_REPORTS/DAILY_REPORT_TEMPLATE]] (or Claude/Codex/bug/handoff template).
- Reporter agent logs it. Main Planner reviews before any commit.
- Never claim a feature built unless verified from code.

## How to navigate command center
- [[MASTER_INDEX]] — index of everything.
- [[CURRENT_STATUS]] — where we are today.
- [[NEXT_ACTIONS]] — what to do next, in order.
- [[DAILY_COMMAND]] — daily copy-ready commands.

## How to use agents + skills
- Agents live in `.claude/agents/` (project scope). See [[AGENT_OPERATING_SYSTEM]].
- Skills live in `.claude/skills/` + documented in [[SKILL_INDEX]].
- One job per agent. Never two agents editing same file.

## What NOT to touch yet
- No edits to app source: frontend, backend, Supabase, styling, routes, components, DB, production code.
- Only create/update `SKXNZ_COMMAND_VAULT/` and `.claude/` during this phase.

## Plugin Dashboards
Requires plugins: Kanban, Dataview, Tasks, Excalidraw, Advanced Canvas.
- [[MASTER_DASHBOARD]] · [[TODAY_KANBAN]] · [[TASKS_DASHBOARD]] · [[DATAVIEW_DASHBOARD]]
- [[AGENT_KANBAN]] · [[ANIMATION_KANBAN]] · [[REPORTS_DASHBOARD]] · [[GRAPH_DASHBOARD]]

## Key links (hub)
[[MASTER_INDEX]] · [[DAILY_COMMAND]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_OPERATING_SYSTEM]] · [[SKILL_INDEX]] · [[ANIMATION_MASTER_PLAN]] · [[DESIGN_RULEBOOK]] · [[DAILY_REPORT_TEMPLATE]] · [[MASTER_MAP]]

Related: [[BRAND_MEMORY]] · [[UI_UX_MEMORY]] · [[ANIMATION_MASTER_PLAN]] · [[GRAPH_RULES]]
