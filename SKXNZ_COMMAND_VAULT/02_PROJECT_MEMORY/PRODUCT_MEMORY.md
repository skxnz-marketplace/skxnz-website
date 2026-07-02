---
tags: [skxnz, brand]
---
# PRODUCT MEMORY

What SKXNZ the product is + verified build state (read-only inspection 2026-07-02).

## Ecosystem (target)
Buyer website · buyer app · seller dashboard · seller app · rider app · admin back office. AI stylist, AI try-on (roadmap), AI seller tools, AI product video prompt, delivery tracking, returns, support, analytics.

## Verified state
- ✅ Frontend page shells (~281 files, ~75 routes) across buyer/seller/admin/AI.
- ✅ Real Supabase auth (signup→confirm→login→redirect, BUYER role, migration 0001 applied).
- 🟡 Catalog DB (0002) written, RLS present, NOT applied, NOT wired — homepage still static data.
- 🟡 AI local rule-based; external provider scaffold = OpenAI, not Claude.
- ❌ No payments/shipping/real-orders. No mobile/rider apps. AI try-on = roadmap card only.

## Rule
Never mark a feature "done" here without confirming in code.

Related: [[BRAND_MEMORY]] · [[TECH_MEMORY]] · [[DECISION_LOG]]
