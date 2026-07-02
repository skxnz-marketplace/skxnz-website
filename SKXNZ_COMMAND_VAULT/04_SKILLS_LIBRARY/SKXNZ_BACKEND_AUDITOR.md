---
tags: [skxnz, skill, backend]
---
# SKILL — SKXNZ Backend Auditor

**When:** checking backend/security/DB state (read-only in infra phase).
**Inputs:** `supabase/**`, `lib/supabase/**`, `lib/catalog/**`, API routes + [[TECH_MEMORY]].
**Process:**
1. Confirm RLS enabled + explicit policies on every table.
2. Check secrets are server-side only; no client-trusted amounts.
3. Check auth on routes; check middleware gating.
4. Verify payments rules (server-authoritative, webhook-verified) when present.
5. Flag Prisma/Supabase overlap; flag OpenAI-vs-Claude provider mismatch.
**Output:** findings list (`file:line → risk → fix`), severity-ranked.
**Quality checklist:** every table has RLS? secrets safe? money in paise? evidence cited?
**Failure modes:** assuming RLS, missing exposed secret, marking mock data as real DB.
**SKXNZ rules:** hard security rules from [[TECH_MEMORY]] are non-negotiable.

Related: [[SKXNZ_FRONTEND_AUDITOR]] · [[TECH_MEMORY]]
