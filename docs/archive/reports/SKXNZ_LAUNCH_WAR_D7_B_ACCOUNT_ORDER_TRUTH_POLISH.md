# SKXNZ LAUNCH WAR — D7-B: Buyer Account, Order Detail, FAQ Truth Sweep

Date: 2026-07-15
Owner: Claude (frontend/UI engineer)

## 1. Starting main repo state

- Main worktree: `skxnz-day2-clean`
- Branch: `launch-war-july30`
- HEAD: `beefb65` (`fix(database): retry catalog recovery with available cli`)
  — the brief's "befb65" is a typo for this hash.
- Tracked tree clean; known unrelated untracked files preserved.

## 2. Worktree and branch created (by Claude)

- Worktree: `skxnz-claude-d7b-account-orders-ui`
- Branch: `claude/d7b-account-orders-ui`, based at `beefb65`
- Dependencies: `node_modules` junction to the main repo (no reinstall).
- All D7-B edits confined to this worktree.

## 3. Routes/components inspected

- `app/account/page.tsx`, `app/account/orders/page.tsx`,
  `app/account/returns/page.tsx`, `app/account/support/page.tsx`,
  `app/account/support/[id]/page.tsx`
- `app/orders/page.tsx`, `app/orders/[id]/page.tsx`
- `app/support/page.tsx`, `app/returns/page.tsx`, `app/faq/page.tsx`
- `components/orders/order-readiness-panel.tsx`,
  `components/support/buyer-support-form.tsx`
- `lib/orders/read-buyer-orders.ts` (`describeOrderStatus`, read-only),
  `lib/support/support-requests.ts`

## 4. Defects found and fixes implemented

1. **/account rendered raw backend errors** (`Role query failed: …`,
   `QUERY ERROR: …`, RLS-policy text) in the role status and a dev-facing
   "Account diagnostics" card. Fixed: raw errors now go to server logs only;
   buyers see friendly copy; diagnostics became a buyer-safe "Account
   details" card (email, account id, human account type, region label).
2. **/account stale copy** claimed orders/order history were "not connected
   yet" although real order history has been live since D4. Fixed the BUYER
   role note and the "Coming next" card; added a "My Orders" quick action.
3. **/account/orders showed a hard-coded "No order has been placed yet"**
   state even when the buyer had real draft orders. Fixed: the page now
   redirects to `/orders`, the single truthful order-history route.
4. **Order readiness panel** said history "will appear after live payment is
   connected" — false (unpaid drafts appear immediately). Copy corrected.
5. **Raw category enums** (`ORDER`, `RETURN`, …) rendered in the buyer
   ticket list and ticket thread. Fixed via a shared
   `supportTicketCategoryLabels` map in `lib/support/support-requests.ts`,
   reused by the support form (removing its private duplicate).
6. **FAQ leaked internal jargon** to the public ("private MVP/demo mode",
   "beta/internal", "demo posts", "MVP users, sellers, testers, and
   operators", internal launch instructions). Rewritten as buyer-facing,
   truthful private-preview copy: payment/delivery/refunds explicitly not
   live, drafts unpaid, seller application ≠ approval, wishlist on-device,
   AI try-on not live, return/shipping policies not final.

## 5. Order detail polish

`app/orders/[id]/page.tsx` audited: DRAFT/PAYMENT_PENDING already labeled
"not paid" with an explicit no-payment/no-tracking banner; totals honest
("Estimated payable", "Calculated at live checkout"); missing/foreign order
→ `notFound()` with no existence leak; backend-not-ready state truthful.
No copy defects found, so no changes beyond the audit; regression tests now
lock the unpaid banner and status wording.

## 6. Returns/support polish

- `/returns` and `/support` public pages audited — already truthful (review
  before refund, no SLA promises). No changes needed.
- `/account/returns` status labels audited — honest per state; "View Order"
  links gained order-specific `aria-label`s.
- Support ticket list/thread now show human category labels; validation
  messages verified buyer-friendly and covered by a test.

## 7. FAQ/truth sweep

Swept rendered copy in FAQ/support/returns/account/orders routes for:
Razorpay-live claims, "payment received", "guaranteed delivery",
"instant refund", "real-time tracking", authenticity guarantees,
demo/mock/placeholder/MVP/test-payment, launch-ready claims. Only the FAQ
internal-jargon items above were confirmed leaks; fixed. A source-scan test
now enforces the sweep on `app/faq/page.tsx`, `app/support/page.tsx`, and
`app/returns/page.tsx` (rendered copy only; comments/imports excluded).

## 8. Accessibility / mobile

- Order-specific `aria-label` on repeated "View Order" buttons in the order
  list and returns list.
- Raw enums replaced with human labels (Task E requirement).
- Existing structures re-checked: `role="alert"` on support form errors,
  `aria-busy` on submit, `min-w-0`/flex-wrap layouts — no overflow defects
  found in audited routes.

## 9. Tests and exact results

8 new tests appended to `tests/commerce-actions.test.cjs`:

1. draft and payment-pending orders are always described as not paid
2. order detail page keeps the unpaid banner and no tracking claims
3. account page shows no raw backend errors and links to real orders
4. account orders page defers to the real order history route
5. order readiness panel does not claim history waits for live payment
6. support ticket categories render via buyer-facing labels
7. support validation messages are buyer-friendly
8. FAQ and public support/returns pages carry no internal or false claims

Results:

- `pnpm.cmd run test:commerce`: **103 tests, 103 pass, 0 fail** (95 prior +
  8 new).
- `pnpm.cmd exec tsc --noEmit --incremental false`: clean.
- ESLint on all 10 changed source files: 0 errors, 0 warnings.
- `git diff --check`: clean.
- Secret scan over the diff: no keys/tokens/secrets.
- Import/reference scan: `supportTicketCategoryLabels` and redirect imports
  resolve; no orphan references to the removed diagnostics code.

## 10. Runtime limitations

- No browser/dev-server verification: preview tooling launches from the main
  worktree, which lacks D7-B edits. Verification is via the compiled test
  suite, full tsc, and ESLint.
- Production `next build` not run in this environment (known limitation; not
  a code failure).

## 11. Files changed

- `app/account/page.tsx`
- `app/account/orders/page.tsx`
- `app/account/returns/page.tsx`
- `app/account/support/page.tsx`
- `app/account/support/[id]/page.tsx`
- `app/orders/page.tsx`
- `app/faq/page.tsx`
- `components/orders/order-readiness-panel.tsx`
- `components/support/buyer-support-form.tsx`
- `lib/support/support-requests.ts`
- `tests/commerce-actions.test.cjs`
- `PROGRESS.md` (D7-B entry)
- `docs/SKXNZ_LAUNCH_WAR_D7_B_ACCOUNT_ORDER_TRUTH_POLISH.md` (this report)

## 12. Confirmations

- Worktree created by Claude; no push; no deployment; no live SQL.
- No Supabase migration, verification SQL, RLS, or RPC changes; server
  actions and backend contracts untouched (only a pure label map added to
  `lib/support/support-requests.ts`).
- No Razorpay/delivery integration added; no live-payment, refund,
  tracking, reservation, or launch-readiness claims introduced.
- SKXNZ logo untouched; unrelated sections not redesigned; unrelated local
  files preserved.
