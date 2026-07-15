# Day 6 verification matrix

| Area | Script or check | Required PASS evidence |
| --- | --- | --- |
| Catalog baseline | Recovered 0002 verify/preflight | Tables, enum, triggers, RLS, policies, and expected fixtures exist. |
| Commerce | `0005` preflight/verify/isolation | Buyer/admin/seller/anon boundaries and integer-paise snapshots pass. |
| Saved items | `0007` verify | Owner-only RLS and grants pass. |
| Returns | `0008` verify/isolation | Atomic request creation, buyer ownership, and note bounds pass. |
| Seller fulfilment | `0009` verify/isolation | Seller-only line mutation, return visibility, and audit pass. |
| Admin actions | `0010` verify/isolation | ADMIN-only atomic order/return transitions and attribution pass. |
| Order intent | `0011` verify/isolation | BUYER-only atomic DRAFT creation, idempotency, and snapshots pass. |
| Application | Commerce tests and browser checklist | Truthful NOT_WIRED behaviour; no payment, refund, or delivery completion claim. |

Record role, exact script revision, fixture IDs, and output for each row. Do not mark live RLS or concurrency proved by mocked tests.
