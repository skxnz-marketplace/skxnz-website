# SKXNZ — Day 5 / D5-2: Address ↔ Checkout Readiness

Branch: `day3-cart-order-flow` · Status: code complete, no migration, not pushed.

## What existed before
- `public.addresses` table already existed and is **live** (0001_user_layer.sql)
  with full RLS: owner select/insert/update/delete (`auth.uid() = user_id`).
- **Checkout already read the real table:** `app/checkout/page.tsx` →
  `getBuyerAddresses()` (`lib/orders/read-buyer-addresses.ts`) →
  `components/checkout/place-draft-order.tsx` radio-selects a real
  `public.addresses` row; `createOrderIntent` re-fetches that row server-side.
- **The account address book did NOT use the real table.** `components/account/
  address-book.tsx` + `lib/data/addresses.ts` stored **device-local demo
  addresses** in `localStorage` (`skxnz-demo-addresses`).
- **Result = the confusion this slice fixes:** a buyer who "added an address" in
  the account page saved a demo/local row that checkout could never see, so
  checkout still said "no saved delivery address." The account page even
  admitted "Real account address persistence is not connected yet."

## Root cause + approach
The address table + RLS + checkout read all existed; only the account **write**
path was device-local demo. Fix = add real server actions for addresses and
rewire the account book to them, so an address added in the account is the same
row checkout reads. **No new migration** — `public.addresses` (0001) is the
single source of truth for both sides now.

## Files changed / added
**New:**
- `lib/data/address-actions.ts` — `"use server"`: `createAddress`,
  `updateAddress`, `deleteAddress`, `setDefaultAddress` + `validateAddressInput`.
- `components/account/address-book-live.tsx` — client book wired to the actions
  (add/edit/delete/make-default, loading + error + status states,
  `router.refresh()` after each action).

**Modified:**
- `lib/orders/read-buyer-addresses.ts` — added `getBuyerAddressBook()`
  (full-field read for editing, `backendReady`/`authenticated` gating).
- `app/account/addresses/page.tsx` — server component: `requireUser` gate,
  server-fetch addresses, render `AddressBookLive`; honest "not connected"
  fallback; honest premium copy (removed the old "not connected yet" demo copy).
- `components/checkout/place-draft-order.tsx` — empty-state copy now
  "Add a delivery address to continue checkout." with a button to
  `/account/addresses`; added an "Add or manage addresses" link under the
  address radio list.

**Unchanged on purpose:** `components/account/address-form.tsx` (reused as-is —
`AddressActionInput` is structurally identical to its `DemoAddressInput`);
`lib/data/addresses.ts` demo lib left on disk (still imported by
`demo-checkout-flow.tsx`/`lib/data/orders.ts`, both unrouted) — not deleted.

## Migration needed?
**No.** `public.addresses` (0001) already live with full owner RLS. No SQL to
apply for D5-2. (0007 saved_items from D5-1 remains unapplied and untouched.)

## RLS approach
No new policies. Server actions rely on the existing 0001 policies
(`addresses: owner can select/insert/update/delete`, all `auth.uid() = user_id`):
- `user_id` is always derived from `supabase.auth.getUser()` — never client input.
- `.eq("user_id", user.id)` on every update/delete is a defensive belt over RLS.
- Default-address invariant is enforced server-side: before setting a row
  default, all the buyer's other rows are set `is_default = false` (own rows only).
- No `service_role` (session client only). No admin policy added (out of scope;
  0001 has no admin address policy and the task said admin read only "if
  existing project admin pattern supports it" — it does not for addresses).

## Address validation (India-ready, simple)
`validateAddressInput`: full name (≤120), phone (7–15 digits after stripping
non-digits), line 1 (≤200), city (≤80), state (≤80), pincode (4–10 digits),
country defaults to "India", line 2 optional, label defaults to "Home".
**Landmark: intentionally omitted** — `public.addresses` has no landmark column
and adding one would need a migration + a `createOrderIntent` snapshot change
(out of scope, avoids overengineering). Server + client both validate.

## Checkout behavior after change
- No saved address → "Add a delivery address to continue checkout." + button to
  `/account/addresses`. Create-draft button disabled.
- One or more saved addresses → radio list (default preselected, "Default"
  badge), plus an "Add or manage addresses" link. No selection → inline error
  "Select a delivery address before creating an order."
- Selected real `public.addresses` row id is sent to `createOrderIntent`, which
  re-fetches it server-side (unchanged, still honest/safe).
- No fake delivery ETA, no fake payment. Razorpay/payment disabled copy
  untouched. Still an unpaid DRAFT only.

## Account / address behavior after change
- `/account/addresses` is `requireUser`-gated (redirects `/login?next=` when
  signed out — verified). Signed-in buyers add/edit/delete/set-default against
  their own `public.addresses` rows.
- Empty state: "No saved addresses yet. / Add a delivery address above to
  continue checkout." First address auto-becomes default.
- Premium SKXNZ styling reused (existing `AddressForm`, `Card`, button variants).
  No logo touched, no cartoonish UI, no full redesign.

## Checks run
- `npx tsc --noEmit` → **EXIT 0**.
- Secret grep (`service_role|sk_live_|rzp_live_`) over the 5 touched files →
  one match, a **comment stating "No service_role"**. No secrets.
- Preview: `/checkout` compiled clean (no errors, no console errors);
  `/account/addresses` compiled and correctly redirected unauthenticated to
  `/login?next=%2Faccount%2Faddresses` (200), no console errors.

## Known limitations
- **Logged-in CRUD not browser-tested** — Supabase is unreachable from this dev
  machine (standing `TypeError: fetch failed`) and the routes are auth-gated, so
  add/edit/delete/set-default and checkout address selection could not be
  exercised live here. Code is typed, validated, RLS-guarded; server actions
  `revalidatePath('/account/addresses')` + `/checkout`.
- Address actions are **not transactional** (supabase-js has no client
  transaction): "clear other defaults" then "set this default" run as two
  statements. Worst case is a transient window with zero defaults — self-heals on
  the next set. A single Postgres RPC would make it atomic (future hardening).
- Landmark field not supported (no DB column) — documented above.
- The old demo address lib (`lib/data/addresses.ts`) still ships (used by
  unrouted demo checkout components); not removed to keep the slice small.

## Next recommended task — D5-3
**Buyer profile + contact cleanup for checkout.** Wire `/account/profile` (and
the contact fields in `CheckoutDraftFlow`) to real `public.user_profiles`
(0001) via server actions — name/phone/city — so the checkout contact snapshot
and the account profile agree, the same way addresses now do. Keep it honest
(no payment/delivery claims), reuse the existing form/design, one commit-sized
slice. Requires nothing new applied (`user_profiles` is already live).
