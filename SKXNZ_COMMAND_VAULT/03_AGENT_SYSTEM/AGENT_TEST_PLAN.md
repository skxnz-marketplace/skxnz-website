---
tags: [skxnz, agent, dashboard]
---
# AGENT TEST PLAN

Safe testing. Vault only — no app source.

## Rules
1. Test only inside `SKXNZ_COMMAND_VAULT/`. Never on app source code yet.
2. Read-only or vault-file edits only.
3. Each agent must produce a report ([[CLAUDE_REPORT_TEMPLATE]]).
4. Master agent ([[skxnz-master-planner]] role) reviews all results before commit.
5. Move agent card through [[AGENT_KANBAN]]: Ready → Testing → Active/Needs Fix → Approved.

## Per-agent test (one by one)
| Agent | Test task (vault-safe) | Pass = |
|---|---|---|
| Master Planner | give today's priority from status files | correct priority + agent + prompt |
| Obsidian Architect | check MASTER_INDEX links resolve | reports broken links (or none) |
| Brand Guardian | review BRAND_MEMORY sample copy | PASS/FIX list |
| UI/UX Director | review UI_UX_MEMORY vs DESIGN_RULEBOOK | consistency report |
| Animation Director | check a motion file vs MOTION_DO_NOT_DO | PASS/FIX |
| Frontend Auditor | read-only list frontend gaps to report | audit table, no edits |
| Backend Auditor | read-only RLS/secret check to report | findings list, no edits |
| Report Writer | fill a daily report | valid report + status update |
| Prompt Engineer | write one scoped prompt | scoped prompt w/ file boundaries |

## Exit
All agents Approved in Kanban → infra test phase done → owner unlocks product work.

Related: [[AGENT_KANBAN]] · [[AGENT_OPERATING_SYSTEM]] · [[AGENT_SAFETY_RULES]]
