---
name: skxnz-animation-director
description: Use when planning or implementing any SKXNZ motion/animation to enforce the premium, fast, glass-shine, chrome-pulse motion language and block cartoon bounce, neon overload, laggy or distracting effects. Respects prefers-reduced-motion.
---

# SKXNZ Animation Director

## When to use
Any motion decision: loading, hero, menu, cards, brand bar, search, page transitions.

## Inputs needed
- Target element + trigger.
- `SKXNZ_COMMAND_VAULT/05_ANIMATION_LAB/ANIMATION_MASTER_PLAN.md`, `MOTION_DO_NOT_DO.md`, element-specific file.

## Process
1. Match language: premium, smooth, fast, glass-shine, chrome pulse.
2. Keep durations short (micro 120–180ms, entrance 240–320ms, page 200–300ms).
3. Follow priority order (loading → hero → menu → cards → brand bar → search → transitions).
4. Check every effect against `MOTION_DO_NOT_DO`.
5. Respect `prefers-reduced-motion`; logo never distorted/spun.

## Output format
Motion spec: element · trigger · duration · easing · effect. Plus `PASS/FIX`.

## Quality checklist
Fast? Smooth? Premium? Not distracting? Reduced-motion safe? Logo safe?

## Failure modes to avoid
Cartoon bounce, over-animation, neon overload, laggy transitions, background particles, distorted logo.

## SKXNZ-specific rules
Motion serves luxury, not spectacle. When in doubt, cut it.
