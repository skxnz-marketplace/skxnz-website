# SKXNZ D1-B Codex Execution Pack

Use this exact task after Claude's D1-A commit is available locally. Do not push, deploy, apply SQL, or merge.

## Future Codex Task

You are Codex working on SKXNZ Day 1-B review and hardening.

Work from the actual Claude D1-A commit, not memory. The prep baseline was `launch-war-july30` at `5cc722905e3ba095e0ab762af7e3515c08eb2e3b`; verify the current local commit before acting.

### Isolation

1. Read `PROGRESS.md`.
2. Run:
   - `git status --short`
   - `git branch --show-current`
   - `git rev-parse HEAD`
   - `git worktree list`
   - `git log --oneline -5`
3. Identify Claude's final D1-A commit from local history. Do not push.
4. Create a fresh sibling worktree from Claude's commit:
   - folder: `../skxnz-codex-d1b-review`
   - branch: `codex/d1b-review`
   - command shape: `git worktree add ../skxnz-codex-d1b-review -b codex/d1b-review <CLAUDE_COMMIT>`
5. If branch/worktree already exists, inspect and reuse only when safe. Do not delete automatically.
6. All D1-B work happens only inside that new worktree.

### Inspect Claude's Full Diff

Run:

- `git show --stat <CLAUDE_COMMIT>`
- `git show --name-only <CLAUDE_COMMIT>`
- `git diff <PRE_CLAUDE_BASE>..<CLAUDE_COMMIT> -- app components lib supabase tests docs middleware.ts package.json`

Focus these current paths:

- `middleware.ts`
- `app/checkout/page.tsx`
- `components/checkout/place-draft-order.tsx`
- `app/orders/page.tsx`
- `app/orders/[id]/page.tsx`
- `components/orders/order-return-panel.tsx`
- `app/account/returns/page.tsx`
- `app/account/support/page.tsx`
- `app/account/support/[id]/page.tsx`
- `app/support/page.tsx`
- `app/returns/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`
- `app/admin/support/page.tsx`
- `app/admin/returns/page.tsx`
- `app/seller/orders/page.tsx`
- `lib/orders/create-order-intent.ts`
- `lib/orders/read-buyer-orders.ts`
- `lib/orders/read-seller-orders.ts`
- `lib/orders/read-admin-orders.ts`
- `lib/orders/admin-update-order-status.ts`
- `lib/returns/create-return-request.ts`
- `lib/returns/read-return-requests.ts`
- `lib/returns/return-requests.ts`
- `lib/support/create-support-ticket.ts`
- `lib/support/add-support-ticket-message.ts`
- `lib/support/read-support-tickets.ts`
- `lib/support/support-requests.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `supabase/migrations/0005_commerce_layer.sql`
- `supabase/migrations/0006_fix_seller_order_item_rls.sql`
- `supabase/verification/0005_commerce_layer_preflight.sql`
- `supabase/verification/0005_commerce_layer_verify.sql`
- `supabase/verification/0005_commerce_layer_isolation.sql`
- `tests/commerce-actions.test.cjs`
- `tests/helpers/mock-supabase.cjs`
- `tests/mocks/supabase-server.cjs`
- `tests/tsconfig.json`

### Run The Prep Matrices

Use the prep docs in `docs/launch-war/day1/codex-prep/`:

- `SKXNZ_D1_CURRENT_COMMERCE_MAP.md`
- `SKXNZ_D1_SECURITY_OWNERSHIP_MATRIX.md`
- `SKXNZ_D1_REGRESSION_TEST_MATRIX.md`

Minimum commands:

- `powershell -ExecutionPolicy Bypass -File scripts/skxnz-d1-readiness.ps1`
- or `bash scripts/skxnz-d1-readiness.sh`
- `pnpm run test:commerce`
- `pnpm run typecheck`
- `pnpm run lint`
- Optional: `powershell -ExecutionPolicy Bypass -File scripts/skxnz-d1-readiness.ps1 -IncludeBuild`

If Supabase is reachable and the operator explicitly permits read-only SQL checks, run:

- `supabase/verification/0005_commerce_layer_preflight.sql`
- `supabase/verification/0005_commerce_layer_verify.sql`
- `supabase/verification/0005_commerce_layer_isolation.sql`
- `supabase/verification/0008_seller_product_ownership_verify.sql`

Do not apply migrations unless the user explicitly asks.

### Implement Confirmed Fixes Only

Prioritize:

1. Buyer A vs Buyer B isolation for orders, returns, and support.
2. Seller A vs Seller B isolation and no seller access to buyer order/address/contact data.
3. Server-authoritative money, status, payment, refund, buyer id, seller id, and sender role.
4. Admin service-role writes only after explicit session-role verification.
5. No `PAID`, `REFUNDED`, delivery, pickup, or courier state without provider/ops authority.
6. Route gates for `/orders`, `/account/*`, `/seller/*`, and `/admin/*`.
7. Public copy that falsely claims live payment/refund/shipping/support automation.

Add focused tests for each code fix. Prefer extending:

- `tests/commerce-actions.test.cjs`
- `tests/helpers/mock-supabase.cjs`
- `tests/mocks/supabase-server.cjs`
- `tests/tsconfig.json`

### Update Reports

Update `PROGRESS.md` only in the future D1-B worktree.

Create `docs/SKXNZ_LAUNCH_WAR_D1_B_CODEX_REVIEW_REPORT.md` with:

1. Claude source commit hash.
2. D1-B worktree path and branch.
3. Files reviewed.
4. Security/ownership findings.
5. Fixes implemented, if any.
6. Tests added/updated.
7. Exact command results.
8. Manual operator steps that remain.
9. Confirmation that no push, deploy, merge, or SQL application happened.

### Commit And Return Evidence

Commit D1-B changes only, with a clear message such as `fix(launch): harden day 1 commerce ownership`.

Final response must include source commit, worktree path, branch, commit hash, commands/results, and unexecuted checks with reasons.
