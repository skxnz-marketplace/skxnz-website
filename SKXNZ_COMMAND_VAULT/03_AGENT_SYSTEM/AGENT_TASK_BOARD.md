---
tags: [skxnz, agent, tasks, board]
title: Agent Task Board
date: 2026-07-02
status: active
---
# AGENT TASK BOARD

Scoped task per agent, phase-gated. Read-only until owner unlocks build phase.
See [[MULTI_AGENT_SKXNZ_WORK_PLAN]] for phases.

## Live slice status — 2026-07-02 → [[PARALLEL_AGENT_RUN_SUMMARY]]

| Slice | Owner | Files | State |
|---|---|---|---|
| Slice 1 — Homepage claims cleanup | Brand Guardian (code) | `components/home/ai-stylist-banner.tsx` | 🔍 **Review** (banner cleaned, trust-bar source identified) |
| Slice 1b — Trust-bar claims cleanup | Brand Guardian (code) | `lib/home-data.ts` (`trustItems` only) | ✅ **Done** (claims softened, shape unchanged) |
| Slice 2 — Auth open-redirect fix | Backend Auditor (code) | `app/auth/callback/route.ts` | ✅ **Done** (committed `e64ec62`) |
| Slice 3 — Supabase RLS admin fix | Backend Auditor (code) | `supabase/migrations/0003` | ✅ **Done / Live verified** (`01ed642`, applied+verified) |
| Slice 4 — H3 `.env.example` drift | Backend Auditor (config) | `.env.example` | ✅ **Done** (fixed, uncommitted) |
| H2 — paise/rupees money-unit | (human-directed) | `supabase/migrations/**` (design) | 🟢 **Next candidate** |
| Catalog `0002` apply | (human-directed) | `supabase/migrations/0002` + seeds | 🔒 Locked (not applied) |
| ReactBits import | UI/UX + Animation | `components/reactbits/**` | 🔒 Locked / planning only |
| Backend architecture fixes | (human-directed) | `lib/catalog/**` | 🔒 Locked / needs isolated backend slice |

Rule holds: **one code-editor at a time**, exact file list before edit.

> [!info] Legend
> 🟢 ready now (read-only / vault) · 🔒 locked until build-phase unlock

## Ownership reference

| Agent | Owns (may touch) | Must NOT touch | Success |
|---|---|---|---|
| **Master Planner** | vault, PROGRESS.md | app source | clear plan, no collisions, review before commit |
| **Obsidian Architect** | `SKXNZ_COMMAND_VAULT/**`, `.claude/**` | app source | vault structured, linked, graph works |
| **Brand Guardian** | vault brand/visual files, `07_REPORTS/**` | app source | brand consistency, no copying, no fake claims |
| **UI/UX Director** | vault UI files; later `components/**`,`app/**`,css | backend, supabase, db | matches [[UI_UX_MEMORY]] |
| **Animation Director** | vault animation files; later motion code | backend, db | matches [[ANIMATION_MASTER_PLAN]] |
| **Frontend Auditor** | read frontend; write vault reports | writes to app source | accurate audit, no false "done" |
| **Backend Auditor** | read backend/supabase; write vault reports | writes to app source | RLS/security findings accurate |
| **Report Writer** | `07_REPORTS/**`, status files | app source | reports current + true |
| **Prompt Engineer** | `06_PROMPT_LIBRARY/**` | app source | prompts scoped + executable |

**Infra phase:** all agents restricted to vault + `.claude/`. App-source columns apply only after owner unlocks build phase.

## Phase 0 — Safety Baseline 🟢

| Agent | Task | Allowed | Forbidden | Report |
|---|---|---|---|---|
| Report Writer | Dirty-tree inventory + branch record | write `07_REPORTS/**` | edit app/source | `DIRTY_TREE_INVENTORY.md` |
| Master Planner | Confirm baseline, set phase order | vault planning | edit app/source | in plan |

## Phase 1 — Read-only Product Audit 🟢 (parallel)

| Agent | Task | Allowed | Forbidden | Report |
|---|---|---|---|---|
| Frontend Auditor | Audit homepage/header/search/category/cards/brand bar/product pages | read `app/**`, write `07_REPORTS/**` | edit any app/source | `FRONTEND_AUDIT.md` |
| Backend Auditor | Audit Supabase/auth/order/payment (RLS, secrets) | read backend, write `07_REPORTS/**` | edit app/source, DB ops | `BACKEND_AUDIT.md` |
| UI/UX Director | Review visual quality vs premium rules | read app, write vault UI notes | edit app/source (infra) | `UIUX_REVIEW.md` |
| Brand Guardian | Review copy/claims legal + brand safe | read app copy, write `07_REPORTS/**` | edit app/source | `BRAND_AUDIT.md` |
| Animation Director | Review motion plan only | read `05_ANIMATION_LAB/**` | edit app/source (infra) | `MOTION_REVIEW.md` |

## Phase 2 — Work Planning 🟢

| Agent | Task | Allowed | Forbidden | Report |
|---|---|---|---|---|
| Master Planner | Convert audit → small slices | vault planning | edit app/source | slice list |
| Prompt Engineer | Scoped prompt per slice | `06_PROMPT_LIBRARY/**` | edit app/source | prompt blocks |
| Obsidian Architect | Update dashboards/kanban/graph | vault + `.claude/**` | edit app/source | updated dashboards |
| Report Writer | Log status | `07_REPORTS/**`, status files | edit app/source | status update |

## Phase 3 — Controlled Frontend Fixes 🔒

| Agent | Task | Allowed | Forbidden | Report |
|---|---|---|---|---|
| UI/UX Director | ONE frontend slice (exact files) | named `app/**`/`components/**` files only | backend/DB, other files | fix report |
| Animation Director | ONE motion slice (exact files) | named motion files only | backend/DB | fix report |

Rule: one executor at a time; exact files defined before edit.

## Phase 4 — Backend/Auth Continuation 🔒

| Agent | Task | Allowed | Forbidden | Report |
|---|---|---|---|---|
| (human-directed) | Supabase/auth slice | named backend files only | UI mixing, secret exposure, payment claims | fix report |
| Backend Auditor | Re-audit the fix (read-only) | read backend, write `07_REPORTS/**` | edit app/source | audit report |

Related: [[MULTI_AGENT_SKXNZ_WORK_PLAN]] · [[FILE_OWNERSHIP_RULES]] · [[PARALLEL_AGENT_RULES]] · [[AGENT_OPERATING_SYSTEM]] · [[AGENT_SAFETY_RULES]]
