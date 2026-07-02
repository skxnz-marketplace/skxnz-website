---
tags: [skxnz, agent]
---
# AGENT SAFETY RULES

1. **No app source edits during infra phase.** Only `SKXNZ_COMMAND_VAULT/` + `.claude/`.
2. No commit/push without owner approval.
3. No two agents on the same file simultaneously.
4. No claiming a feature built unless verified in code.
5. No placeholder business claims, no fake metrics.
6. No copying existing brands (identity/layout/wording/logo).
7. Enforce hard security rules when building later: RLS on every table, secrets server-side, payments server-authoritative + webhook-verified, no raw card data, money in paise.
8. Every agent writes a report before ending.
9. If unsure, stop and ask — do not guess on irreversible actions.
10. Keep SKXNZ premium, futuristic, sharp, buildable.

Related: [[AGENT_OPERATING_SYSTEM]] · [[AGENT_TASK_BOARD]]
