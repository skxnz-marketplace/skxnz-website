# D10-B Admin/Seller Quick QA

Unauthenticated probe only (no login performed).

| Route | Result | Detail |
|---|---|---|
| `/seller` | PASS | 307 → `/login?next=%2Fseller` |
| `/admin` | PASS | 307 → `/login?next=%2Fadmin` |
| `/admin/operations` | PASS | 307 → `/login?next=%2Fadmin%2Foperations` |

Auth middleware gating works with correct `next` params on all three. No unauthenticated leakage of admin/seller UI. Consistent with founder feedback that admin/dashboard surfaces are in good shape; no further action from D10-B.
