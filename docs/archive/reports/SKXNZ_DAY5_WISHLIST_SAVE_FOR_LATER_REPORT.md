# SKXNZ — Day 5 / D5-1: Wishlist & Save-For-Later × Live Products

Branch: `day3-cart-order-flow` · Status: code complete, migration NOT applied, not pushed.

## Goal
A buyer can save LIVE Supabase catalog products cleanly, without relying only on
old local/demo product data. Saved items keep a self-contained snapshot so they
render even if the product's live display data changes.

## What existed before
- Wishlist was **100% browser-local** in `components/marketplace/marketplace-provider.tsx`:
  it stored only an array of product-id **strings** in `localStorage` key
  `skxnz-marketplace-wishlist`.
- `wishlistProducts` derived full products by looking each id up in `catalog`
  (= `seedProducts`, the demo catalog). **Live products (`dataSource: "live"`)
  are never in `catalog`, so a saved live product silently vanished** — the id
  resolved to nothing and was filtered out.
- `WishlistButton` (product cards + product detail) only passed a bare id, so a
  live save stored an id that could never be resolved back.
- Cart "Save For Later" was **explicitly hidden for live items**
  (`item.product.dataSource !== "live"`) because the wishlist couldn't render them.
- Wishlist pages `/wishlist` and `/account/wishlist` both rendered the same
  client `WishlistGrid` with "saved locally for now" copy.
- `lib/data/wishlist.ts` had unused draft/merge helpers anticipating DB sync.
- **No Supabase wishlist/saved-items table existed** in any migration (0001–0006).

The cart had already solved the exact same problem by storing a full product
**snapshot** for live items — the wishlist simply never got the same treatment.

## Implementation path
No saved-items table existed → **added a new migration draft** plus a
server-authoritative data layer, AND fixed the client wishlist to store
snapshots (the actual bug). Two clearly-separated layers:

1. **Device-local wishlist** (works today, no backend needed) — now stores full
   product snapshots, so live products save and render on this device.
2. **Account-synced saved items** (Supabase `saved_items`) — durable, RLS-owned,
   operator-applied. Honest states until the migration is applied.

## Files changed / added

**Migration + verification (drafts — NOT applied):**
- `supabase/migrations/0007_buyer_saved_items.sql` — NEW. `public.saved_items` table.
- `supabase/verification/0007_buyer_saved_items_verify.sql` — NEW. 8 read-only checks + manual isolation notes.

**Server data layer (new):**
- `lib/saved/saved-items.ts` — types + `validateSaveProductInput` (trim/clamp,
  price → non-negative integer, uuid-shape checks, `source` whitelist).
- `lib/saved/read-saved-items.ts` — `getSavedItems()` server read (session +
  RLS, `backendReady`/`authenticated` gating, 42P01-safe).
- `lib/saved/save-actions.ts` — `"use server"` `saveProduct()` / `removeSavedProduct()`.

**Client + UI:**
- `lib/data/wishlist.ts` — added `WishlistSnapshot` type + `normalizeStoredWishlist()`
  (migrates legacy id arrays and new snapshot arrays; drops unknown ids).
- `components/marketplace/marketplace-provider.tsx` — wishlist state is now
  `WishlistSnapshot[]`; `addToWishlist`/`toggleWishlist` accept an optional
  `product` snapshot; `wishlistProducts` prefers fresh demo catalog and falls
  back to the stored snapshot for live products; `moveWishlistItemToCart` passes
  the snapshot so live items reach the cart.
- `components/wishlist/wishlist-button.tsx` — optional `product?: Product` prop.
- `components/sections/product-card.tsx` — passes `product` to both `WishlistButton`s.
- `components/buyer/product-purchase-panel.tsx` — `toggleWishlist(id, product)`.
- `components/buyer/cart-preview-table.tsx` — "Save For Later" now works for live
  items too (removed the `dataSource !== "live"` gate) and passes the snapshot.
- `components/account/wishlist-grid.tsx` — honest "saved on this device" copy.
- `components/account/account-saved-items.tsx` — NEW server component: the
  account-synced saved-items panel with honest states.
- `app/account/wishlist/page.tsx` — renders `AccountSavedItems` (synced) above
  `WishlistGrid` (device-local); `force-dynamic`.

## Migration added
`0007_buyer_saved_items.sql` — `public.saved_items`:
- Fields: `id uuid pk`, `user_id uuid not null → public.users(id) on delete cascade`,
  `product_id uuid (nullable)`, `product_slug text not null`, `product_title text not null`,
  `brand_name text`, `price_inr integer (>=0)`, `image_url text`, `selected_size text`,
  `selected_variant_id uuid`, `source text default 'live' check in ('live','demo')`,
  `created_at`, `updated_at`.
- `price_inr` is **whole rupees** (a display snapshot, matching `public.products`),
  never a payment amount, never a float.
- Unique dedupe index on `(user_id, product_slug, coalesce(size,''), coalesce(variant,'000…'))`.
- `updated_at` trigger reuses `public.set_updated_at`.
- Idempotent (create-if-not-exists, drop-policy-if-exists) — safe to re-run.

## RLS approach
- `revoke all from anon, authenticated`; then grant **only** `select, insert,
  delete` to `authenticated` (no UPDATE — a saved item is immutable; re-saving is
  delete+insert; the dedupe index makes a repeat save idempotent).
- Policies (mirror the addresses/admin pattern in 0001/0003):
  - `saved_items: owner can select` — `auth.uid() = user_id`.
  - `saved_items: admin can select` — `public.is_admin()` (read-only admin inspect).
  - `saved_items: owner can insert` — `with check (auth.uid() = user_id)` (a buyer
    can never write another user's `user_id`).
  - `saved_items: owner can delete` — `auth.uid() = user_id`.
- Server actions derive `user_id` from `supabase.auth.getUser()` — **never** from
  client input. No `service_role` anywhere (session client + RLS only).

## Logged-out behavior (honest)
- Device-local wishlist works signed-out (localStorage), clearly labeled
  "Saved on this device."
- `AccountSavedItems` shows **"Sign in to sync"** for anon and never claims
  device-local saves are synced.
- `/wishlist` and `/account/wishlist` are middleware-protected → `/login`; the
  account page's synced panel only renders for a real session.
- `saveProduct`/`removeSavedProduct` return `UNAUTHENTICATED` when signed out.

## Live product snapshot behavior
- Saving stores the full buyer `Product` in the device-local snapshot, so live
  products render in the wishlist grid and can be moved to the cart.
- The Supabase snapshot stores slug/title/brand/price/image/size/variant so an
  account-synced saved item renders even if the live product later changes; if
  the product row is removed, `product_id` may be null but the snapshot survives.
- No fake stock/payment/delivery: the table stores display data only. No "instant
  refund", "guaranteed delivery", or "payment live" claims anywhere.

## Checks run
- `npx tsc --noEmit` → **EXIT 0** (zero errors).
- Secret grep (`service_role|sk_live_|rzp_live_`) over all touched
  frontend/server-action/migration files → only two matches, both **comments
  stating NO service_role is used**. No secrets.
- **Browser smoke (dev server, device-local — Supabase is unreachable from this
  machine, standing blocker):**
  - `/shop` renders 15 live-mapped/demo cards, 30 save buttons, **0 console errors**.
  - Clicking Save stores a `{ productId, product, addedAt }` snapshot (verified in localStorage).
  - Legacy `["neutra-x-hoodie","x-1-signal-jacket","totally-unknown-id"]` migrated
    to 2 snapshots — aliases resolved (`neutra-x-hoodie`→`chrome-trace-hoodie`),
    unknown id dropped.
  - Toggle add/remove flips count 2→3→2 and `aria-pressed` correctly.

## Known limitations
- **Account-sync insert/remove not browser-tested** — Supabase is unreachable
  from this dev machine (standing `TypeError: fetch failed`) and `0007` is not
  applied, so `saveProduct`/`removeSavedProduct` and the synced grid could not be
  exercised live. Code path is typed + validated + 42P01-guarded.
- The device-local wishlist and the account-synced saved items are **not yet
  auto-merged** — saving on a card writes device-local; the account panel reads
  the DB. A future slice can sync device-local saves into `saved_items` on login.
- `WishlistButton` still saves device-local only (no server call on click). The
  server actions exist and are wired to the read path, but the click-to-sync
  wiring is deferred (kept small + testable without Supabase).

## Operator steps (when ready)
1. Supabase Dashboard → SQL Editor → paste `supabase/migrations/0007_buyer_saved_items.sql` → Run once.
2. Paste `supabase/verification/0007_buyer_saved_items_verify.sql` → compare each result to its EXPECT.
3. On a Supabase-reachable machine, sign in and confirm `/account/wishlist` shows
   the "No account-synced saves yet" state (not "not connected"), then call
   `saveProduct` and confirm one owned `saved_items` row + cross-buyer RLS denial.

## Next recommended task — D5-2
**Wire the save button to the account when signed in, and merge device-local
saves into `saved_items` on login.** Concretely: on `WishlistButton` toggle, if
`useAuth().user` exists, call `saveProduct`/`removeSavedProduct` (optimistic, with
the device-local snapshot as fallback); on sign-in, one-time push any device-local
snapshots into `saved_items` (dedupe by the unique index) so a buyer's saves
follow them across devices. Requires `0007` applied first.
