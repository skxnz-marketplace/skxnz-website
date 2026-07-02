---
tags: [skxnz, agent]
---
# MULTI-AGENT WORKFLOW

## Safe parallel
- OK: UI/UX Director + Backend Auditor (different folders).
- NOT OK: two agents both in `components/` or both in `supabase/`.
- Unsure → run sequentially.

## Sequencing overlap work
When a task needs both (e.g. wire catalog into homepage): Backend first → then Frontend. Master Planner orders it.

## Branch strategy
- Work branch: `local-polish-auth-ui`.
- Big feature → new branch `feature/<name>`. Keep `main` deployable.

## Handoff
Agent finishing mid-task fills [[HANDOFF_TEMPLATE]] → next agent picks up with full context.

## Review gate
All reports → Master Planner review → owner approval → commit.

Related: [[AGENT_OPERATING_SYSTEM]] · [[HANDOFF_TEMPLATE]] · [[MULTI_AGENT_WORKFLOW]]
