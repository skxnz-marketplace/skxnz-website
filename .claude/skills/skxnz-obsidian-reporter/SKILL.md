---
name: skxnz-obsidian-reporter
description: Use at the end of a work block or when status changes to write SKXNZ vault reports, update CURRENT_STATUS and NEXT_ACTIONS, log decisions, and add wikilinks/tags — with no fake completion claims.
---

# SKXNZ Obsidian Reporter

## When to use
End of any work block; whenever status, bugs, or decisions change.

## Inputs needed
- What was done + files touched.
- `SKXNZ_COMMAND_VAULT/07_REPORTS/*` templates, `01_COMMAND_CENTER/*`.

## Process
1. Pick correct template (daily/claude/codex/bug/handoff) and fill it.
2. Update `CURRENT_STATUS.md` + `NEXT_ACTIONS.md`.
3. Log decisions in `DECISION_LOG.md`.
4. Add wikilinks + tags per `09_GRAPH_SYSTEM`.
5. Verify every claim against real code — no false "done".

## Output format
Completed report + list of updated status files.

## Quality checklist
Accurate? Linked (2–3)? Tagged? No fake claims? Next steps clear?

## Failure modes to avoid
Stale status, missing links, inflated progress, orphan note.

## SKXNZ-specific rules
Vault always reflects real code state. Vault-only edits; never app source.
