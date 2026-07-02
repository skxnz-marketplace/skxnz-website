---
tags: [skxnz, skill]
---
# SKILL — SKXNZ Prompt Engineer

**When:** writing a prompt for Claude or Codex.
**Inputs:** the task + target files + relevant vault rules.
**Process:**
1. State role + goal in one line.
2. Name exact files allowed to touch; name files NOT to touch.
3. List concrete steps.
4. Add constraints (UI/UX rules, security rules, no app edits in infra phase).
5. Require a report of files changed at the end.
**Output:** copy-paste prompt block.
**Quality checklist:** scoped? file boundaries clear? constraints stated? report required?
**Failure modes:** vague scope, no file boundaries, inviting scope creep.
**SKXNZ rules:** always scope + always require report; never invent features.

Related: [[CLAUDE_MASTER_PROMPTS]] · [[CODEX_MASTER_PROMPTS]]
