# SKXNZ Phase 0 Execution Plan

## Phase 0 goal
Phase 0 creates the control layer before any new feature merge. It protects SKXNZ from random rewrites, unsafe claims, unclear priorities, and broken Phase 1 continuation.

## Phase 0 scope
Phase 0 is documentation and safety setup only.

Allowed:

1. Add project planning docs.
2. Add safety docs.
3. Add repo audit docs.
4. Record current project structure.
5. Run available checks.
6. Create safe git checkpoints.

Not allowed:

1. Do not merge Phase 1 pack yet.
2. Do not rebuild the homepage.
3. Do not overwrite current working homepage/theme/navbar code.
4. Do not make the website public.
5. Do not connect real payments, AI, delivery, auth, or production database.

## Required Phase 0 files
These files must exist in `docs/`:

1. `SKXNZ_MASTER_CONTEXT.md`
2. `SKXNZ_PHASE_0_EXECUTION_PLAN.md`
3. `SKXNZ_PHASE_PLAN.md`
4. `SKXNZ_UI_RULES.md`
5. `SKXNZ_FEATURE_PRIORITIES.md`
6. `SKXNZ_SIGNAL_COMMUNITY_PLAN.md`
7. `SKXNZ_QA_CHECKLIST.md`
8. `SKXNZ_REPO_AUDIT_CHECKLIST.md`
9. `SKXNZ_SAFE_CHECKPOINT_PROTOCOL.md`
10. `SKXNZ_NEGATIVE_RULES.md`
11. `SKXNZ_LEGAL_SAFETY_RULES.md`
12. `SKXNZ_PHASE_1_HANDOFF.md`

## Execution order
1. Create a checkpoint for current working code.
2. Add Phase 0 docs only.
3. Inspect the real repo structure.
4. Update the audit and handoff docs with real paths.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Run `npm test` only if a test script exists.
8. Create final Phase 0 checkpoint.

