# SKXNZ Safe Checkpoint Protocol

## Before any major change
Run:

```bash
git status
```

If uncommitted work exists, identify it before editing. Do not overwrite user work.

## Required checkpoint before docs
Created during this Phase 0 run:

```bash
git commit -m "checkpoint: preserved current SKXNZ homepage and theme fixes before phase 0 docs"
```

## Required final Phase 0 checkpoint
After docs and checks:

```bash
git add .
git commit -m "checkpoint: SKXNZ phase 0 docs and safety setup added"
```

## Build rule
Do not create a completed checkpoint if a real build error remains unresolved.

## Safe revert rule
Prefer:

```bash
git revert <commit_hash>
```

Do not use destructive commands like `git reset --hard` unless the founder explicitly approves and all work is backed up.

## Phase 1 continuation rule
Before any Phase 1 merge:

1. Read `docs/SKXNZ_PHASE_1_HANDOFF.md`.
2. Run `git status`.
3. Preserve current homepage, navbar, global CSS, Tailwind config, and AI assistant.
4. Patch only the files required by the approved Phase 1 task.

