# D5-B Checkout Payment Readiness

## Outcome

D5-B completes the buyer-facing readiness layer around D5-A's atomic unpaid-order contract. Checkout remains payment-disabled and creates only a server-authoritative `DRAFT`; the D5-A RPC, migrations, RLS, and database trust boundary were not changed. The only result-contract addition is the existing RPC's `reused` flag, exposed to the UI so a compatible retry can be described as a recovered draft.

## State model

The checkout now presents distinct ready, validating, submitting, newly created draft, recovered draft, authentication expired, invalid address, stale stock, unavailable product/variant, idempotency conflict, service not ready, retryable failure, and non-retryable validation states. Internal error codes are converted to bounded buyer copy and raw database responses are never rendered.

The server does not expose a separate stale-price error because it authoritatively uses current catalog prices. The review therefore states before submission that price and availability are rechecked; it never claims that a specific price changed without server evidence.

## Retry and idempotency

- One random attempt key is created for the mounted checkout view.
- Temporary retries retain that exact key.
- A conflict stays visible and disables resubmission with the conflicting key.
- Only the explicit **Start a new checkout attempt** action rotates the key.
- Pending submission is guarded in the handler and at the disabled button.
- Compatible retries use the RPC's `reused` result and route to the existing draft.
- Success uses history replacement to avoid a back-button resubmission path; the cart remains intact.

## Payment and success truthfulness

The payment control remains disabled and says that online payment is unavailable. No provider logo, payment-success state, security certification, refund promise, countdown, shipping promise, or delivery date is shown. A successful result opens the real order route, where the existing order UI labels `DRAFT` as unpaid. The legacy `/checkout/success` route now explicitly says it is not a paid-order confirmation.

Checkout copy now explains that items, options, quantities, prices, and addresses are rechecked; no payment is taken; and checkout support is available. The payment-related FAQ now distinguishes real unpaid drafts from unavailable payment, fulfilment, and tracking.

## Accessibility and responsive behavior

Address choices remain native labelled radio controls. Submission exposes busy state, errors use assertive alerts, non-error updates use polite status announcements, keyboard targets meet the existing button sizing, focus treatment is visible, and long address/copy content can wrap. The action panel collapses from a bounded two-column desktop layout to one mobile column with no viewport-width or fixed-overflow layout.

## Automated coverage

The commerce suite increased from 78 to 88 registered tests. Ten D5-B tests cover created versus recovered drafts, retry key retention, explicit conflict rotation, safe error-state mapping, duplicate-submit blocking, history-safe navigation, persistent conflict UI, buyer-copy/payment honesty, trusted-field exclusion, accessibility/responsive structure, and the legacy success route. Existing buyer, seller, and admin tests remain green.

These are mocked application tests and source-contract checks, not browser automation, live PostgreSQL idempotency/concurrency proof, live RLS proof, or payment-provider proof.

## Validation

- `pnpm.cmd run test:commerce`: PASS — 88/88, 0 skipped, 0 failed.
- `pnpm.cmd exec tsc --noEmit --incremental false`: PASS.
- `pnpm.cmd exec eslint app/checkout app/faq components/checkout lib/checkout lib/orders/create-order-intent.ts`: PASS.
- `git diff 0b6fe94 --check`: PASS before commit; the committed-range check is repeated after commit.
- Targeted secret, honesty, and dead-reference scans: PASS; no secret values found and no buyer-facing raw backend terms were introduced.
- Dead-reference review: legacy demo checkout modules are still imported by account-history/data code, so they were not deleted.
- Route smoke: Next.js started successfully, but `/checkout`, `/checkout/success`, and `/orders/<id>` stopped in middleware with HTTP 500 because this isolated worktree has no Supabase public URL/key. No secrets were copied to bypass that environment boundary. Static route files, TypeScript, ESLint, and tests passed.

## Files changed

- `PRODUCT.md`
- `app/checkout/success/page.tsx`
- `app/faq/page.tsx`
- `components/checkout/checkout-draft-flow.tsx`
- `components/checkout/checkout-next-steps.tsx`
- `components/checkout/place-draft-order.tsx`
- `lib/checkout/order-attempt.ts`
- `lib/orders/create-order-intent.ts`
- `tests/commerce-actions.test.cjs`
- `tests/tsconfig.json`
- `docs/SKXNZ_LAUNCH_WAR_D5_B_CHECKOUT_PAYMENT_READINESS.md`
- `PROGRESS.md`

## Limitations and blockers

- Payment, fulfilment, courier assignment, tracking, refunds, and delivery estimates remain intentionally unavailable.
- Migration 0011 remains draft and unapplied; live compatible-retry/conflict/concurrency behavior still requires disposable Supabase QA.
- D5-A's Critical canonical `0002_catalog_layer.sql` recovery blocker remains unresolved, so the full 0002–0011 chain is not integration-ready.
- Authenticated runtime route smoke still requires operator-provided non-secret public Supabase configuration in an appropriate QA environment.

No push, merge, deployment, live SQL, migration/RLS/RPC edit, secret addition, or source local-settings change was performed.
