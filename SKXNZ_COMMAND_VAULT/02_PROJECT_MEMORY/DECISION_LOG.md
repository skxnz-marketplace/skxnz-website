---
tags: [skxnz, decision]
---
# DECISION LOG

Append-only. Newest on top. One line per decision + date + why.

- **2026-07-02** — Command infrastructure built (vault + agents + skills). Why: central control before scaling app work.
- **2026-07-02** — App code frozen during infra setup. Why: avoid mixing planning with production edits.
- **2026-07-02** — Header must be solid dark maroon, not glassy. Why: premium look, owner preference.
- **2026-07-02** — Homepage/buyer UI to white/off-white + compact cards. Why: clean premium density.
- **OPEN** — AI provider: project goal is Claude API, but code scaffold is OpenAI. Decide direction.
- **OPEN** — Prisma vs Supabase single source of truth. Decide before catalog wiring.

Related: [[TECH_MEMORY]] · [[UI_UX_MEMORY]] · [[BRAND_MEMORY]]
# D3-B atomic seller fulfilment

- Decision: replace the split service-role UPDATE/audit calls with an authenticated `SECURITY DEFINER` RPC that locks the seller-owned line and writes the audit event atomically. Seller returns use a separate minimal status/quantity RPC; no seller support-thread access. [[SKXNZ_LAUNCH_WAR_D3_B_SELLER_HARDENING]]
