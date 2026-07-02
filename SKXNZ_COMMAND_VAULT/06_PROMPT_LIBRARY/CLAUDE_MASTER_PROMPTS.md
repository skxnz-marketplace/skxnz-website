---
tags: [skxnz]
---
# CLAUDE MASTER PROMPTS

Reusable, scoped. Infra phase = no app edits.

## Daily planner
```
Read SKXNZ_COMMAND_VAULT CURRENT_STATUS.md + NEXT_ACTIONS.md.
Give today's single top task, the agent to run it, and the exact prompt. No app code edits.
```

## Assign a task
```
Act as <agent name> (.claude/agents/<file>). Task: <task>.
Only touch: <files>. Do NOT touch: <files>. Follow the vault rules.
End with a report from the matching template in 07_REPORTS.
```

## Review before commit
```
Master Planner: review the changes made this session (list files). Check against
AGENT_SAFETY_RULES.md + UI_UX_MEMORY.md. Approve or send back with fixes. Do not commit.
```

Related: [[CODEX_MASTER_PROMPTS]] · [[SKXNZ_PROMPT_ENGINEER]]
