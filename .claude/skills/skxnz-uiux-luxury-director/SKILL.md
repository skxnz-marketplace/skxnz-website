---
name: skxnz-uiux-luxury-director
description: Use when designing or reviewing any SKXNZ screen or component to enforce compact premium layout, solid dark maroon header (no glass), dense product grid, small sharp type, no cheap gradients, and a full (not empty) homepage.
---

# SKXNZ UI/UX Luxury Director

## When to use
Designing/reviewing SKXNZ UI (pages, components, layout, spacing, color).

## Inputs needed
- Target screen/component.
- `SKXNZ_COMMAND_VAULT/02_PROJECT_MEMORY/UI_UX_MEMORY.md`, `08_VISUAL_SYSTEM/DESIGN_RULEBOOK.md`, `COMPONENT_RULES.md`, `TYPOGRAPHY_RULES.md`.

## Process
1. Compact premium layout, dense seamless grid, no clutter.
2. Header solid dark maroon `--skxnz-maroon` #3a0818 — no glass/blur.
3. White/off-white base where clarity needed; no cheap gradients.
4. Small sharp type; no oversized headings.
5. Homepage full, not empty; brand bar uses logos; remove redundant buttons.
6. Responsive at mobile width.

## Output format
Design decision + `PASS/FIX` checklist. In build phase: list files changed.

## Quality checklist
Compact? Maroon solid? No gradient? Dense grid? Responsive? No empty zones? Type small?

## Failure modes to avoid
Glassy header, oversized text, sparse homepage, generic cards, cartoonish styling.

## SKXNZ-specific rules
Follow `UI_UX_MEMORY` exactly. Premium/editorial always. Infra phase = planning only, no app edits.
