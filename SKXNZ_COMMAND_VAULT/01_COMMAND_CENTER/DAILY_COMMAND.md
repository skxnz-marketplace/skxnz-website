---
tags: [skxnz, daily-report]
---
# DAILY COMMAND

Copy-ready commands for each part of the day. Related: [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[DAILY_REPORT_TEMPLATE]]

## ☀️ Morning startup (paste to Claude)
```
Read SKXNZ_COMMAND_VAULT/01_COMMAND_CENTER/CURRENT_STATUS.md and NEXT_ACTIONS.md.
Give me today's single top priority and the exact agent + prompt to run.
Do NOT modify any app source code — infrastructure/planning phase only.
```

## 🕛 Mid-day checkpoint (paste to Claude)
```
Checkpoint: list what changed since morning (files touched), what's left from NEXT_ACTIONS.md,
and any blockers. Update CURRENT_STATUS.md. No app code edits.
```

## 🌙 End-day report (paste to Claude)
```
Fill a daily report using SKXNZ_COMMAND_VAULT/07_REPORTS/DAILY_REPORT_TEMPLATE.md.
Log files changed, decisions, bugs found/fixed, blockers, next Claude prompt, next Codex prompt.
Update NEXT_ACTIONS.md. Do not commit/push without my approval.
```

## One-task rule
Do ONE task at a time. Assign to correct agent ([[AGENT_TASK_BOARD]]). Report before moving on.
