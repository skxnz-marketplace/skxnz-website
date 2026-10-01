# Worktrees

Parallel agent tasks (Claude, Codex) each get their own Git worktree, so they never share a
working tree or a `node_modules`.

## Convention

- Location: `<repo>/.worktrees/<task>` (ignored by Git, excluded from lint). Nowhere else.
- Branch: `<agent>/<task>`, e.g. `claude/seo-metadata`, `codex/d14-payments`.
- Base: the canonical branch `integrate/recover-missing-work`.

```bash
git worktree add .worktrees/seo-metadata -b claude/seo-metadata integrate/recover-missing-work
cd .worktrees/seo-metadata && pnpm install --frozen-lockfile
```

## Finishing a task

1. Merge or cherry-pick the branch into `integrate/recover-missing-work` and run all checks.
2. Make sure nothing is left behind: `git -C .worktrees/<task> status` is clean and
   `git cherry integrate/recover-missing-work <branch>` shows no `+` lines. Cherry-picks show as
   `-` when their content matches. If a `+` line remains, check by subject; a conflict-resolved
   cherry-pick can differ.
3. `git worktree remove .worktrees/<task>`. Never `--force` and never delete the folder by hand,
   because a manual delete leaves stale metadata behind (fix that with `git worktree prune`).
4. Keep the branch. Removing a worktree never deletes its branch or commits.

## Safety rules

- Never remove a worktree that has uncommitted changes or unique commits. Commit them to a
  `backup/<name>-wip` branch first (that is how `backup/local-polish-auth-ui-wip` saved the Prism work).
- Never move a worktree folder by hand; use `git worktree move`.
- One branch can be checked out in only one worktree.

## Current state (normalization complete, 2026-10-01)

This repository lives at `SKXNZ/code/web` and is **standalone**: `.git` is a normal directory
(`git rev-parse --git-common-dir` prints `.git`). It has no linked worktrees. Canonical branch:
`integrate/recover-missing-work`.

It was built by copying the old Git database (previously owned by
`skxnz-platform-checkpoint-e7013e6` inside the old command pack) and verified against it:
identical refs, commits, remotes and reflogs, plus all gates and a browser smoke test. The full
record is in the workspace's `archive/backups/normalization-state/history.log`.

The old main checkout had uncommitted edits identical (tree `6fc900b`) to branch
`backup/local-polish-auth-ui-wip`. It is archived, with the old command pack, under
`SKXNZ/archive/command-pack/` (frozen; don't work there).

### Retired worktrees

The 30 historical launch-war task trees (`skxnz-claude-*`, `skxnz-codex-*`, `skxnz-d12a-*`,
`.worktrees/d13b-performance-runtime`) were retired on 2026-10-01. Before retirement:

- All clean (one lockfile shows a line-ending-only change).
- None contains local-only files beyond duplicate `.env.local` copies and `node_modules`.
- Their branches are kept.
- Only 3 of their commits aren't in canonical by content:
  - `claude/d10e-integration`: `5b9cbcf` (merge commit), `f04bcd9` (QA report)
  - `codex/live-catalog-permissions`: `bfb655e` (diagnostic test)

  These stay reachable through their branches.

29 were removed with `git worktree remove`. The first, `skxnz-claude-d10b-visual-qa`, was
unregistered by a removal that failed on a Windows path-length limit; its leftover files were
then deleted by hand, after its branch was re-verified. Every branch is kept in this repo.

Lesson: on Windows, set `git config core.longpaths true` before removing worktrees that contain
`node_modules`.
