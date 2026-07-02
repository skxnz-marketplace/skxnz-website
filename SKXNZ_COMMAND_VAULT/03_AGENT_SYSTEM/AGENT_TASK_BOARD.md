---
tags: [skxnz, agent]
---
# AGENT TASK BOARD

| Agent | Owns (may touch) | Must NOT touch | Success |
|---|---|---|---|
| **Master Planner** | vault, PROGRESS.md | app source | clear plan, no collisions, review before commit |
| **Obsidian Architect** | `SKXNZ_COMMAND_VAULT/**`, `.claude/**` | app source | vault structured, linked, graph works |
| **Brand Guardian** | vault brand/visual files | app source | brand consistency, no brand copying |
| **UI/UX Director** | vault UI files; later `components/**`,`app/**`,css | backend, supabase, db | matches [[UI_UX_MEMORY]] |
| **Animation Director** | vault animation files; later motion code | backend, db | matches [[ANIMATION_MASTER_PLAN]] |
| **Frontend Auditor** | read frontend; write vault reports | writes to app source | accurate audit, no false "done" |
| **Backend Auditor** | read backend/supabase; write vault reports | writes to app source | RLS/security findings accurate |
| **Report Writer** | `07_REPORTS/**`, status files | app source | reports current + true |
| **Prompt Engineer** | `06_PROMPT_LIBRARY/**` | app source | prompts scoped + executable |

**Infra phase:** all agents restricted to vault + `.claude/`. App-source columns apply only after owner unlocks build phase.

Related: [[AGENT_OPERATING_SYSTEM]] · [[AGENT_SAFETY_RULES]]
