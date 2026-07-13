---
tags: [skxnz]
---
# NEXT ACTIONS

Exact order. No app code until step 8.

1. Open [[00_START_HERE]] in Obsidian.
2. Open [[MASTER_INDEX]].
3. Check Graph View (no orphans → [[GRAPH_RULES]]).
4. Install only safe Obsidian plugins: **Kanban, Dataview, Tasks, Excalidraw** (manual, in Obsidian settings).
5. ✅ Test Claude agents one by one (`.claude/agents/*`) — 9/9 PASS → [[AGENT_SMOKE_TEST_REPORT]].
6. Test SKXNZ skills one by one (`.claude/skills/*`).
7. Build animation command plan → [[ANIMATION_MASTER_PLAN]].
8. ✅ Multi-agent work plan created → [[MULTI_AGENT_SKXNZ_WORK_PLAN]].
9. ✅ Phase 0 + Phase 1 audits done → [[DIRTY_TREE_INVENTORY]], [[FRONTEND_READONLY_AUDIT]], [[BACKEND_READONLY_AUDIT]], [[READONLY_AUDIT_SUMMARY]].
10. ✅ Cowork coordination plan created → [[COWORK_COORDINATION_PLAN]]. 4 workers defined, 1 code-editor (Homepage Cleanup Agent, trust-bar.tsx + ai-stylist-banner.tsx only), 3 read-only auditors (ReactBits, Supabase Security, Backend Architecture).
11. ✅ Ran Homepage Cleanup (code) + ReactBits/Supabase/Backend (read-only) in parallel. All scopes respected, no forbidden files touched → [[PARALLEL_AGENT_RUN_SUMMARY]].
12. ✅ Master Planner consolidated results. Slice 1 done as scoped; ReactBits + Supabase + Backend fixes remain LOCKED (wait for clean tree / migration branch).
13. ✅ **Slice 1b done** — `lib/home-data.ts` `trustItems` softened, shape unchanged → [[SLICE_1B_TRUSTBAR_CLAIMS_CLEANUP_REPORT]]. Homepage claims clean at copy level → [[SLICE_1_AND_1B_STATUS_UPDATE]].
14. **NEXT:** Review diff for Slice 1 + 1b (`git diff -- components/home/ai-stylist-banner.tsx lib/home-data.ts`).
15. Decide whether to commit **only** Slice 1 + 1b files + related vault reports (isolated from the rest of the dirty tree).
16. Next safe code slice = **auth callback open-redirect fix** (`app/auth/callback/route.ts`, single file, M6 in [[SUPABASE_SECURITY_DEEP_AUDIT]]). Then brand-bar logos.
17. Keep **LOCKED:** ReactBits, package/config files, Supabase migrations, backend architecture — each needs its own isolated slice.
18. ✅ **Slice 2 committed** (`e64ec62`) — auth callback open-redirect fix. ✅ **Slice 3 committed** (`01ed642`) — `is_admin()` helper + de-recurse `public.users` policy (migration `0003`, **not applied**).
19. ✅ **Slice 3 migration `0003` applied live + verified** → [[SLICE_3_SUPABASE_LIVE_APPLY_REPORT]]. H1 (recursive `public.users` admin RLS) closed in live DB. `count(*) = 6`, no recursion error.
20. ✅ **Slice 4 done + committed** (`5ad0661`) — H3 `.env.example` drift fixed.
21. ✅ **Slice 5 done + committed** (`093561d`) — H2 money-unit guardrail `lib/money.ts`.
22. ✅ **Day closed** → [[2026-07-02_DAILY_REPORT]]. 6 commits local, none pushed.
23. **TOMORROW (order):** (1) `git status --short` + `git log --oneline -8` sanity; (2) **push-strategy decision** — push 6 clean commits via safe branch/PR, isolated from dirty tree; (3) **H2b schema decision** draft-only; (4) catalog `0002` verify/apply **plan** (do NOT apply); (5) ReactBits stays locked until backend safety clears. First prompt = §10 of the daily report. Do NOT `git add -A`.
21. **Do NOT apply catalog `0002` yet.** Do NOT push. Do NOT create PR.
22. Still LOCKED: ReactBits, package/config, catalog `0002` apply, seeds/verification, catalog M7 `is_admin()` repoint (after `0002`), brand-bar logos, middleware route-protection.
23. Master Planner reviews before any commit. Full 4-agent code parallelism only after dirty tree cleaned into worktrees.

Related: [[CURRENT_STATUS]] · [[DAILY_COMMAND]] · [[AGENT_TASK_BOARD]] · [[MULTI_AGENT_SKXNZ_WORK_PLAN]] · [[PARALLEL_AGENT_RULES]] · [[COWORK_COORDINATION_PLAN]]
# Day 4 first action

- Apply the reviewed 0009 draft only to disposable Supabase QA, run two-seller isolation/concurrency proof, then authenticated seller browser QA. [[SKXNZ_LAUNCH_WAR_DAY3_CLOSE_REPORT]]
