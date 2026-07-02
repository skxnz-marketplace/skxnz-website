---
tags: [skxnz, skill, frontend]
---
# SKILL — SKXNZ Frontend Auditor

**When:** checking frontend state vs standards (read-only during infra phase).
**Inputs:** target pages/components + [[UI_UX_MEMORY]] + [[DESIGN_RULEBOOK]].
**Process:**
1. Read files (no edits in infra phase).
2. Compare against UI/UX rules (header, grid, type, gradients, density).
3. List gaps with `file:line → issue → fix`.
4. Verify claims against actual code; mark unbuilt clearly.
**Output:** audit table (file · issue · severity · fix).
**Quality checklist:** evidence-based? no false "done"? actionable fixes?
**Failure modes:** guessing, marking mock UI as functional, vague findings.
**SKXNZ rules:** report truth only; premium standard as benchmark.

Related: [[SKXNZ_UI_UX_LUXURY_DIRECTOR]] · [[SKXNZ_BACKEND_AUDITOR]]
