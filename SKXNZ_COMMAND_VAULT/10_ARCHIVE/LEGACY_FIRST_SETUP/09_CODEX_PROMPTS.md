---
tags: [skxnz, archived]
---
> **Archived from first setup. Current command system lives in structured folders.** See [[MASTER_INDEX]] · [[00_START_HERE]].

# 09 — CODEX PROMPTS

Copy-paste, one at a time. Each is scoped and executable. Codex touches ONLY named files.

---

## A. Frontend polish prompt
```
You are working on SKXNZ (Next.js App Router + TypeScript + Tailwind).
Follow SKXNZ_COMMAND_VAULT/05_UI_UX_RULEBOOK.md exactly.
Tasks:
1. Make the header solid dark maroon (use --skxnz-maroon #3a0818). Remove any glass/blur/transparency. Files: components/shared/navbar.tsx, app/globals.css.
2. Tighten homepage density and reduce empty gaps. Files: app/page.tsx, components/home/*.
3. Compact product cards: smaller text, tighter spacing, denser grid. Files: components/sections/product-card.tsx, components/shared/product-grid.tsx.
4. Keep white/off-white background. No new gradients. Keep responsive.
Do NOT touch supabase/, lib/supabase/, lib/catalog/, or API routes.
After: list every file changed and describe each change in one line.
```

## B. Search behavior prompt
```
SKXNZ search upgrade. Files: components/shared/site-search-bar.tsx, src/lib/site-search.ts.
1. On input focus (empty query), show 4–5 recommended items.
2. While typing, filter results live by matching typed letters (case-insensitive substring/prefix match), updating as the user types.
3. Keep it responsive and fast; no backend call required (use existing search index).
Do NOT touch styling tokens in globals.css or unrelated components.
List files changed and summarize logic in a few lines.
```

## C. Backend inspection prompt
```
SKXNZ backend audit. Read-only unless fixing.
1. Confirm Supabase auth wiring: lib/supabase/{client,server,admin}.ts.
2. Review supabase/migrations/0001_user_layer.sql and 0002_catalog_layer.sql: confirm RLS enabled on EVERY table with explicit policies; every table has created_at, updated_at, owner column.
3. Flag any table missing RLS, any secret exposed to the browser, any client-trusted amount.
4. Report Prisma vs Supabase overlap (lib/prisma.ts) and recommend one source of truth.
Output a findings list (file:line + issue + fix). Do not change UI files.
```

## D. Supabase / Auth + Catalog continuation prompt
```
SKXNZ catalog go-live. 
1. I will run in Supabase SQL Editor, in order: supabase/migrations/0002_catalog_layer.sql, supabase/seeds/0002_catalog_seed.sql, supabase/verification/0002_catalog_verify.sql. Tell me if any statement would fail and why before I run.
2. After it's applied, wire the homepage and shop to lib/catalog/queries.ts, with fallback to lib/home-data.ts if a query returns empty. Files: app/page.tsx, app/shop/page.tsx, relevant components/home/*.
3. Generate/refresh TypeScript types from the schema; keep DB as single source of truth.
Enforce: RLS stays on, secrets server-side, no client-trusted data.
List files changed.
```

## E. Bug fixing prompt
```
SKXNZ bug fixes from SKXNZ_COMMAND_VAULT/07_KNOWN_BUGS.md. Fix ONE at a time; ask before batching.
Start with: category strip clipping (components/home/category-strip.tsx) and brand bar using logos instead of text (src/components/brands/top-brands-toolbar.tsx).
For each: describe the cause, the fix, and the files changed. Keep changes minimal and within the named files. Verify responsive at mobile width.
```
