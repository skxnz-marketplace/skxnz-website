---
tags: [skxnz, agent]
---
# AGENT OPERATING SYSTEM

How SKXNZ Claude agents run. Beginner-friendly.

## Golden rules
1. One job per agent.
2. Never two agents editing the same file at once.
3. Ownership by folder (see [[AGENT_TASK_BOARD]]).
4. Every agent writes a report before ending ([[07_REPORTS/CLAUDE_REPORT_TEMPLATE]]).
5. Main Planner reviews before any commit.
6. No commit/push without owner approval.
7. **During infra phase: no app source edits — only `SKXNZ_COMMAND_VAULT/` + `.claude/`.**

## Agents (project scope, in `.claude/agents/`)
- skxnz-master-planner · skxnz-obsidian-architect · skxnz-brand-guardian · skxnz-uiux-director · skxnz-animation-director · skxnz-frontend-auditor · skxnz-backend-auditor · skxnz-report-writer · skxnz-prompt-engineer

## Session flow
1. Master Planner reads vault → picks one task.
2. Assign to right agent with clear prompt.
3. Agent works within its folder ownership.
4. Agent writes report → Report Writer logs it.
5. Master Planner reviews → owner approves → commit.

Related: [[AGENT_SAFETY_RULES]] · [[MULTI_AGENT_WORKFLOW]] · [[HANDOFF_TEMPLATE]]
