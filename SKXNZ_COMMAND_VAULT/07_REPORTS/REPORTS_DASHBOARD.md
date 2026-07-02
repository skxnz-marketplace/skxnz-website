---
tags: [skxnz, dashboard, daily-report]
---
# 📁 REPORTS DASHBOARD

All report files in `07_REPORTS`. Auto via **Dataview**.

## All report files
```dataview
list
from "SKXNZ_COMMAND_VAULT/07_REPORTS"
sort file.mtime desc
```

## Tagged #daily-report (whole vault)
```dataview
table file.mtime as "Modified"
from #daily-report
sort file.mtime desc
```

## Templates
- [[DAILY_REPORT_TEMPLATE]] · [[CLAUDE_REPORT_TEMPLATE]] · [[CODEX_REPORT_TEMPLATE]] · [[BUG_REPORT_TEMPLATE]] · [[HANDOFF_REPORT_TEMPLATE]]
- Setup: [[INFRA_SETUP_REPORT]]

Related: [[MASTER_DASHBOARD]] · [[CURRENT_STATUS]]
