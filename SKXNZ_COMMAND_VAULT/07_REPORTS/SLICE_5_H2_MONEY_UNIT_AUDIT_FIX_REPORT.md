---
title: Slice 5 — H2 Money-Unit Audit + Guardrail Helper
date: 2026-07-02
tags:
  - report
  - money
  - backend
  - paise
  - slice
  - security
type: audit-fix
agent: skxnz-backend-auditor
status: complete
app_source_touched: lib/money.ts
schema_touched: false
payments_touched: false
commit: false
push: false
pr: false
---

# Slice 5 — H2 Money-Unit Audit + Guardrail Helper

> [!abstract] Outcome
> No schema/payment change. Added one canonical `lib/money.ts` helper + documented the SKXNZ money rule so future order/checkout code cannot silently create a 100x error. `products.price_inr` (rupees) left as-is; conversion boundary is now named and centralized.

**Date:** 2026-07-02

## Money fields found
| Location | Field | Unit | Notes |
|---|---|---|---|
| `supabase/migrations/0002_catalog_layer.sql` | `products.price_inr`, `compare_at_price_inr` | **whole rupees** (int) | DB source of truth; not applied live yet |
| `lib/catalog/types.ts:39,56` | `price_inr`, `compare_at_price_inr` | rupees | mirror of DB |
| `lib/catalog/mappers.ts:17-18` | `price_inr * 100` → `HomeProduct.price` | rupees → **paise** | ✅ correct conversion, comment explicit |
| `lib/home-data.ts:28-30,58-60` | `HomeProduct.price` (paise), `formatPrice(paise)` | **paise** | divides /100 for display |
| `src/data/demo-products.ts:31,341` | `priceCents = displayPrice * 100` | **paise-style** | demo/static |
| `lib/data/orders.ts:63-65,141+,316` | `subtotalCents`, `totalCents` | **paise-style** | mock orders, `localStorage` only, `PaymentStatus "Not Connected in MVP"` |
| `src/lib/ai/*`, `seller-*` data | `₹` budget strings | display only | not amounts |

## Current rupees/paise risk (H2)
- Catalog DB stores **rupees** (`price_inr`), while the app's product/order shapes use **paise** (`HomeProduct.price`, `*Cents`).
- Today the single conversion point (`lib/catalog/mappers.ts` `*100`) is correct. **Risk is future:** whoever wires checkout/orders straight from `price_inr` without `*100` produces a **100x** underquote; or reads a paise `*Cents` value as rupees → 100x overquote.
- No live payments/checkout yet (`orders.ts` mock, `localStorage`; Razorpay 0% wired), so the bug is **latent, not active**.

## Canonical SKXNZ money rule (recorded)
> [!important] Money rule
> 1. **Backend / order / payment amounts = integer paise, always.** 1 rupee = 100 paise. No floats.
> 2. `products.price_inr` holds **whole rupees** → convert with `rupeesToPaise()` before any order/payment use.
> 3. **UI / catalog display** shows rupees via `formatInrFromPaise()` / `formatInrFromRupees()` (`₹` en-IN).
> 4. **Never** pass a rupee value into a payment/order amount field (Razorpay + order rows expect paise).

## Files edited
- **`lib/money.ts` — created** (only app/source file). Pure, no deps, no I/O.
  - `rupeesToPaise(rupees)` — `Math.round(rupees*100)` (float-safe)
  - `paiseToRupees(paise)`
  - `formatInrFromPaise(paise, {withDecimals?})`
  - `formatInrFromRupees(rupees, {withDecimals?})`
  - Header documents the money rule + the `price_inr` rupees→paise boundary.
- Vault: this report + `CURRENT_STATUS.md`, `NEXT_ACTIONS.md`, `AGENT_TASK_BOARD.md`.

## Helper created/updated
- **Created** `lib/money.ts` (no prior money helper existed). Existing `formatPrice()` in `lib/home-data.ts` left untouched (out of scope; still valid paise formatter).

## Payment/order/schema file touched?
- **No.** No `supabase/migrations/**`, no seeds, no `lib/data/orders.ts`, no payment provider code, no `price_inr` rename, no migration created.

## Verification
- `tsc --noEmit --skipLibCheck lib/money.ts`: no type errors in `lib/money.ts`.

## Remaining risk
- `price_inr` staying rupees while app uses paise is a **naming trap** still present in the DB; fully resolved only by a future migration that either renames `price_paise` (+ convert seed ×100) or documents rupees-MVP explicitly. That is a **schema slice** (deferred per rules 4/6).
- Existing call sites (`mappers.ts`, `demo-products.ts`, `orders.ts`) not yet refactored to use `lib/money.ts` — safe to migrate incrementally; no behavior change required now.
- Razorpay/order amount wiring must use `rupeesToPaise()` at the boundary when built.

## Exact next safe slice
**H2b (schema decision slice, later):** draft — not apply — a migration to make catalog money-unit explicit (`price_paise` rename + ×100 seed convert, OR a documented rupees-MVP + paise conversion at the payments boundary). Keep locked until owner opens a backend-schema slice. Do NOT apply catalog `0002` yet.

## Commit / push / PR
- Autopilot commit performed for this slice (see commit step). Push / PR: No.

## Related
[[SUPABASE_SECURITY_DEEP_AUDIT]] · [[BACKEND_ARCHITECTURE_READONLY_AUDIT]] · [[SLICE_4_H3_ENV_DRIFT_AUDIT_FIX_REPORT]] · [[CURRENT_STATUS]] · [[NEXT_ACTIONS]] · [[AGENT_TASK_BOARD]]
