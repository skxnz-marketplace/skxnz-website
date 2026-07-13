# SKXNZ Launch War D3-B — Seller Hardening

## Scope

- Source reviewed: `f8c05dc` (`feat(seller): complete seller order operations`)
- Worktree: `../skxnz-codex-d3b-review`
- Branch: `codex/d3b-seller-hardening`
- No migration in this report has been applied.

## D3-A review findings

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | The line UPDATE and audit INSERT used two service-role calls; an event failure could leave an unaudited line mutation. | Replaced with one locked, authenticated RPC transaction. No privileged fallback remains. |
| Medium | There was no seller-safe return awareness. | Added a narrow seller-owned active-return RPC exposing only line id, active status, and requested quantity. |
| Low | Legacy dashboard seller-order widgets displayed seeded buyer/order data and were no longer routed by the live seller order flow. | Removed the three unused order-demo files and dashboard import. |

Verified D3-A claims: session-derived seller reads; seller-owned-line filtering; seller-only subtotals; no seller `orders` read; missing/unrelated order indistinguishability; no buyer address/payment/tracking/support reads in seller pages; server-side line-action validation; forward-only UI ladder; and draft-migration read-only behaviour. The action’s former split-write atomicity claim was not verified and is the High fix above.

## Atomic fulfilment

`0009_seller_line_fulfilment.sql` now defines `public.seller_update_line_fulfilment`. It is `SECURITY DEFINER` with an explicit search path, derives its actor from `auth.uid()`, requires a `SELLER` user, locks a seller-owned post-payment line, validates the exact next transition and bounded note, then updates only seller fulfilment fields and inserts its event in one transaction. It cannot receive or set a seller id, buyer, payment/refund, order-wide status, inventory, shipping, or tracking value. The app calls only this RPC; a missing RPC produces the existing truthful read-only response.

## Scoped return visibility

`public.seller_active_return_indicators(uuid[])` is a `SECURITY DEFINER`, read-only RPC. It returns only seller-owned requested line ids, active return status, and quantity. It excludes return reason/note, buyer/support/payment data, other sellers, and `REJECTED`, `CLOSED`, and `REFUNDED` requests. The seller list/detail render an indicator only when the RPC is available; otherwise they show no fabricated return state.

## Operator files

- `supabase/migrations/0009_seller_line_fulfilment.sql` — extended draft migration.
- `supabase/verification/0009_seller_line_fulfilment_verify.sql` — schema, grant, and RPC verification.
- `supabase/verification/0009_seller_line_fulfilment_isolation.sql` — two-seller/concurrency operator checklist, rollback-only.

## Validation

- `pnpm run test:commerce`: not runnable in this worktree — PowerShell blocks `pnpm.ps1`; `pnpm.cmd` then reports no local `node_modules`.
- Direct test compiler attempt: blocked because this sandbox denies writes to `tests/.build` in the dedicated worktree and cannot resolve the worktree dependency tree. No test result is claimed.
- Live authenticated smoke: not run; Supabase must be reachable and the draft migration must first be applied by an operator.

## Remaining launch blockers

- Critical: apply/verify the existing commerce, 0006, and extended 0009 migrations in the intended Supabase project before enabling seller actions.
- High: run the two-seller isolation/concurrency harness with distinct non-admin seller QA accounts; then run authenticated seller browser QA.
- High: restore a writable dependency/build setup in the D3-B worktree and run the commerce suite plus TypeScript/ESLint before merge.

No push, merge, deploy, live SQL, or secret handling occurred.
