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

## Current state (audited 2026-10-01)

Canonical working tree: this checkout, branch `integrate/recover-missing-work`. It is a *linked*
worktree. The repository's `.git` lives in
`SKXNZ_PROJECT_ECOSYSTEM_COMMAND_PACK 2/skxnz-platform-checkpoint-e7013e6/.git`, whose own
checkout is `local-polish-auth-ui` with uncommitted edits that are **identical** (same tree hash
`6fc900b`) to branch `backup/local-polish-auth-ui-wip`.

The other 30 worktrees are historical launch-war task trees (`skxnz-claude-*`, `skxnz-codex-*`,
`skxnz-d12a-*`, `.worktrees/d13b-performance-runtime`):

- All clean (one lockfile shows a line-ending-only change).
- None contains local-only files beyond duplicate `.env.local` copies and `node_modules`.
- Their branches are kept.
- Only 3 of their commits aren't in canonical by content:
  - `claude/d10e-integration`: `5b9cbcf` (merge commit), `f04bcd9` (QA report)
  - `codex/live-catalog-permissions`: `bfb655e` (diagnostic test)

  These stay reachable through their branches.

They are **pending removal** with `git worktree remove` once the founder approves. The
workspace-level `README.md` has the command list.
