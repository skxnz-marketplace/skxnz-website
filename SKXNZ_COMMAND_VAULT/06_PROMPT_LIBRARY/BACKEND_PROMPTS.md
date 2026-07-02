---
tags: [skxnz, backend]
---
# BACKEND PROMPTS

_Use only after owner unlocks build phase._

## Audit (read-only)
```
Backend Auditor: audit supabase/**, lib/supabase/**, lib/catalog/**, API routes.
Confirm RLS + policies on every table, secrets server-side, auth on routes, middleware gating.
Flag Prisma/Supabase overlap + OpenAI-vs-Claude provider mismatch. Output findings (file:line → risk → fix). No edits.
```

## Apply catalog
```
Guide me to run in Supabase SQL Editor in order:
0002_catalog_layer.sql → 0002_catalog_seed.sql → 0002_catalog_verify.sql.
Flag any statement that would fail before I run. Confirm RLS stays on.
```

## Wire catalog to UI
```
After catalog verified: wire app/page.tsx + app/shop/page.tsx to lib/catalog/queries.ts,
fallback to lib/home-data.ts if empty. Keep RLS/secrets rules. Report files changed.
```

Related: [[TECH_MEMORY]] · [[SKXNZ_BACKEND_AUDITOR]]
