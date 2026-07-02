---
name: skxnz-token-saver-graphify
description: Use when vault notes get long or token cost rises. Compresses prose to fragments (keeping all technical facts, code, URLs), replaces repetition with wikilinks, and ensures each note links to 2-3 others with correct tags.
---

# SKXNZ Token Saver / Graphify

## When to use
Long notes; rising context/token cost; graph has orphans or weak links.

## Inputs needed
- Target note(s).
- `SKXNZ_COMMAND_VAULT/09_GRAPH_SYSTEM/GRAPH_RULES.md`, `TAG_SYSTEM.md`.

## Process
1. Compress prose to fragments — keep ALL facts, code, URLs, numbers.
2. Replace repeated content with a wikilink to the canonical note.
3. Ensure the note links to 2–3 related notes (Related: line).
4. Apply correct tags from `TAG_SYSTEM`.
5. Route dead content to archive flow (`10_ARCHIVE`).

## Output format
Shorter note + summary of links/tags added.

## Quality checklist
Meaning intact? Facts preserved? Links added? Tags valid? Actually shorter?

## Failure modes to avoid
Deleting real info, broken links, over-compressing into ambiguity.

## SKXNZ-specific rules
Never trade technical accuracy for brevity. Preserve code blocks verbatim.
