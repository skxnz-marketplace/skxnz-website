# Commerce database reconciliation: migration 0020 (2026-10-01)

Status: **0020 APPLIED to production on 2026-10-02 20:46 UTC**, with founder approval, via
Supabase `apply_migration` only (history row `20261002204620`). Verification is in section 11.

- Migration: `supabase/migrations/0020_reconcile_missing_commerce_objects.sql`
  (md5 `188e02c43c02fdde67cd8fa7fe1388b8`)
- Test: `supabase/verification/0020_forced_rollback_test.sql`
- Project: `hhsorrkvgvxxpwzrggei` ("skxnz"), shared by local development and skxnz.com

## 1. Why this exists

The canonical branch is 45 commits ahead of what skxnz.com runs. Before deploying it, every
database object the code calls was checked against the live database. Eight database
functions and two tables were missing:

- `create_order_intent_atomic`
- `admin_update_order_status_atomic`, `admin_update_return_status_atomic`
- `seller_update_line_fulfilment`, `seller_active_return_indicators`
- `create_support_ticket_idempotent`, `add_support_ticket_message_idempotent`,
  `create_return_request_idempotent`
- tables `saved_items` and `order_item_events`

The currently live code already calls the first five functions and `saved_items`, so checkout,
admin order/return actions, seller fulfilment and the wishlist are already broken in
production. The three support and returns functions are new in the canonical branch:
deploying it without 0020 would also break support tickets and return requests.

## 2. Live baseline: 0005 + 0006

Read-only audit of the live database, compared object by object with the repo migrations:

| Area | Live state |
|---|---|
| Commerce tables `orders`, `order_items`, `order_events`, `support_tickets`, `support_ticket_messages`, `return_requests`, `return_request_items` | Present. Columns, check constraints, foreign keys, indexes, `updated_at` triggers, RLS policies and grants match **0005** exactly |
| `seller_owns_post_payment_order_line()` and the seller order-line policy | Present, matching **0006** |
| `return_request_items.reason` | Present (the one 0008 column that already exists) |
| Anything else from 0007, 0008, 0009, 0010, 0011, 0016 | **Absent** |
| Dependencies the missing objects need: `users`, `addresses`, `products`, `product_variants`, `set_updated_at()`, `is_admin()` | Present |
| Data in commerce tables | **0 rows** in every one. 7 users: 6 BUYER, 1 ADMIN, no SELLER |
| Migration history (`supabase_migrations.schema_migrations`) | Only 0017, 0017b-d, 0018, 0019 recorded |

An `ensure_rls` event trigger on the project turns RLS on for every new table automatically.
0020 still enables it explicitly.

## 3. Missing capabilities, by original migration

| Migration | What it was meant to add | Live |
|---|---|---|
| 0007 | `saved_items` table (buyer wishlist): unique index, `updated_at` trigger, owner-only RLS, select/insert/delete grant | Missing |
| 0008 | Length checks on return reason/note; **revoke direct buyer INSERT on `return_requests` / `return_request_items`** and drop the two buyer insert policies; draft function `create_return_request_atomic` | Missing (column already present) |
| 0009 | `order_items.seller_fulfilment_status/_note/_updated_at` with check and index; `order_item_events` audit table with RLS; `seller_update_line_fulfilment`; `seller_active_return_indicators` | Missing |
| 0010 | `admin_update_order_status_atomic`, `admin_update_return_status_atomic` | Missing |
| 0011 | `orders.idempotency_key/_fingerprint` with unique index; `create_order_intent_atomic` | Missing |
| 0016 | Idempotency key/fingerprint columns and unique indexes on support tickets, support messages and return requests; the three idempotent functions | Missing |

## 4. Why the historical migrations were not replayed

The live migration history is incomplete: 0001-0016 were applied by hand, or partly, or not
at all. Replaying them (`supabase db push`, migration repair, or re-running the files) would:

- run SQL against a database that is already partly evolved (0005/0006 objects exist,
  0008's column exists);
- risk re-creating or duplicating objects and policies;
- write migration-history rows that claim things happened that did not.

So the old files stay untouched as the record of *intended* schema. 0020 is a new,
forward-only migration that adds only what was proven missing. It will be applied with
Supabase `apply_migration` (only its own SQL; one history row), never with `db push`.

## 5. Every object 0020 introduces

| Object | Kind | From |
|---|---|---|
| `public.saved_items` | table: 13 columns, 2 checks, FK to `users` (cascade) | 0007 |
| `saved_items_unique_per_buyer_idx`, `saved_items_user_id_idx`, `saved_items_product_id_idx` | indexes | 0007 |
| `saved_items_set_updated_at` | trigger | 0007 |
| `saved_items`: owner can select / admin can select / owner can insert / owner can delete | RLS policies | 0007 |
| `saved_items` grants: authenticated select, insert, delete; anon nothing | grants | 0007 |
| `return_requests_reason_length_d1b`, `return_requests_note_length_d1b`, `return_request_items_reason_length_d1b` | check constraints (NOT VALID; tables empty) | 0008 |
| Revoke INSERT on `return_requests`, `return_request_items` from authenticated; drop 2 buyer insert policies | security change | 0008 |
| `order_items.seller_fulfilment_status` (default `PENDING`), `seller_fulfilment_note`, `seller_fulfilment_updated_at` | columns | 0009 |
| `order_items_seller_fulfilment_status_check`, `order_items_seller_fulfilment_status_idx` | check, index | 0009 |
| `public.order_item_events` | table, 2 checks, FKs, index `order_item_events_line_idx` | 0009 |
| `order_item_events`: seller / buyer / admin policies; authenticated select only | RLS, grants | 0009 |
| `seller_update_line_fulfilment(uuid,text,text,text)` | SECURITY DEFINER function | 0009 |
| `seller_active_return_indicators(uuid[])` | SECURITY DEFINER function | 0009 |
| `admin_update_order_status_atomic(uuid,text,text)`, `admin_update_return_status_atomic(uuid,text,text)` | SECURITY DEFINER functions | 0010 |
| `orders.idempotency_key`, `orders.idempotency_fingerprint`, `orders_buyer_idempotency_key_unique` | columns, partial unique index | 0011 |
| `create_order_intent_atomic(jsonb,uuid,text,uuid)` | SECURITY DEFINER function (**fixed**, section 7) | 0011 |
| Idempotency key/fingerprint columns + partial unique indexes on `support_tickets`, `support_ticket_messages`, `return_requests` | columns, indexes | 0016 |
| `create_support_ticket_idempotent`, `add_support_ticket_message_idempotent` | SECURITY DEFINER functions | 0016 |
| `create_return_request_idempotent(uuid,text,text,jsonb,uuid)` | SECURITY DEFINER function (**fixed**, section 6) | 0016 |

Every function has `set search_path = public, pg_temp`, and has EXECUTE revoked from `public`
and `anon` and granted only to `authenticated`. Each derives the actor from `auth.uid()` and
checks the role itself.

Deviations from the historical SQL (everything else is byte-for-byte, checked by script):

1. 0007/0009/0010/0011/0016 file headers omitted.
2. 0008: `ADD COLUMN reason` omitted (already live); `DROP CONSTRAINT IF EXISTS` guard before
   each new check; `create_return_request_atomic` not created (nothing calls it; the 0016
   idempotent version replaces it).
3. 0016: alias fix in `create_return_request_idempotent` (section 6).
4. 0011: pricing fix plus guard in `create_order_intent_atomic` (section 7).
5. 0016, review fixes (section 7a): buyer role checks, a race-safe ticket create, and NULL
   validation.

## 6. Defect 1: return requests always failed (42702)

`create_return_request_idempotent` (0016) declares a record variable `v` and also aliases
JSON elements as `j(v)` in its two validation subqueries. PL/pgSQL cannot tell them apart,
so **every call** failed with:

```
42702: column reference "v" is ambiguous
```

Return requests could never have worked with the repo SQL. Fix: the subquery alias is renamed
to `e` (`j(e)`, `e->'order_item_id'`, …). No logic changes. After the fix, the full return
path passes (section 8).

## 7. Defect 2: wrong stored line prices in mixed carts

`create_order_intent_atomic` (0011) prices the cart twice:

- pass 1 computes the order subtotal correctly;
- pass 2 writes `order_items` but **never clears `v_variant`** on a line without an option.

Such a line therefore took the option price of whichever variant was last loaded, from
pass 1 or an earlier line. The subtotal (what the buyer is asked to pay) stayed right, but
stored unit prices and line totals were wrong, and line totals no longer added up to the
subtotal.

Evidence from the rollback run on the unfixed function (paise):

| Cart | Expected | Subtotal | Sum of lines | Wrong line |
|---|---|---|---|---|
| option → plain | 170000 | 170000 | 240000 | P2 stored 120000, should be 50000 |
| plain → option | 170000 | 170000 | 240000 | P2 stored 120000 |
| option ×3 + plain ×2 | 610000 | 610000 | 750000 | P4 stored 150000, should be 80000 |
| 3-line reversed | 370000 | 370000 | 520000 | P2 stored 200000 |

Carts that are all-option or all-plain were correct.

Fix in 0020:
- pass 2 sets `v_variant := null` on lines without an option;
- a new guard raises `SKXNZ_PRICE_MISMATCH` (22023) and rolls back the order if stored line
  totals do not add up to the subtotal.

The guard never fired in the fixed run. It is a safety net, not a path that was exercised.

## 7a. Review fixes in the 0016 support and return RPCs (2026-10-02)

Found in founder review of the first 0020 draft, not by the original tests:

1. **Buyer role not enforced.** `create_support_ticket_idempotent`,
   `add_support_ticket_message_idempotent` and `create_return_request_idempotent` only checked
   that a session existed. These functions are SECURITY DEFINER and callable by every
   signed-in user, so an ADMIN or SELLER could open their own ticket and have it recorded with
   `sender_role = 'BUYER'`. No other customer's data was exposed, but it broke the role
   model. All three now read `public.users.role` and return `{ok:false, code:'BUYER_REQUIRED'}`
   for anyone who is not a BUYER. They keep their JSON results rather than raising errors, so
   the app's handling is unchanged. The app has no special case for `BUYER_REQUIRED`; it falls
   through to the generic error, which is fine because only non-buyers can hit it.
2. **Ticket creation not race-safe.** It did "look up key, then insert". Two simultaneous
   submits could both miss the lookup, and the loser then failed on the unique index instead
   of getting `reused=true`. It now inserts with
   `ON CONFLICT (buyer_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`
   (the same pattern as the order RPC) and resolves the existing ticket when nothing was
   inserted. Only the transaction that created the ticket writes the opening message.
   `add_support_ticket_message_idempotent` needed no change here: it locks the parent ticket
   first, which serializes concurrent writes. Returns lock the order first, so they are
   already serialized too.
3. **NULL slipped through validation.** `p_category NOT IN (...)` and `p_sender_role <> 'BUYER'`
   are unknown, not true, for NULL. Now `p_category IS NULL OR ...` and
   `p_sender_role IS DISTINCT FROM 'BUYER'`.

## 8. Rollback-test evidence

Method: the whole migration text is executed inside one `DO` block. The block then creates
synthetic users through `auth.users` (buyer, second buyer, seller, admin), synthetic products
and variants, and an address. It calls every function as those users via
`set local role` and JWT claims, then ends with `RAISE EXCEPTION`, so nothing persists.
Real customers, orders and products were never read or written by the test. The first value
reported is `md5(migration text)`, which proves which file was tested.

Final run (md5 `188e02c43c02fdde67cd8fa7fe1388b8`, equal to the file), all green:

- **Review fixes** (new):
  - ADMIN and SELLER calling ticket create, message add or return create all get
    `BUYER_REQUIRED`; 0 tickets were written for non-buyers.
  - NULL category and NULL sender role give `VALIDATION_FAILED`.
  - **Race path:** a temporary copy of the ticket function with only its early key lookup
    disabled forces the `ON CONFLICT` branch. Same key and same content returns
    `reused=true` with the same ticket and adds 0 opening messages; same key with different
    content gives `IDEMPOTENCY_CONFLICT`; a new key creates a ticket with exactly 1 opening
    message; 1 ticket exists for the key. True parallel sessions cannot run inside one
    rolled-back transaction, so this exercises the conflict branch, not two live connections.
- Everything below re-ran unchanged and green:

- **Pricing**: 11/11 PASS. Each case compares an independently computed expected unit price
  with the stored unit price, line total, sum of lines and order subtotal. Cases:
  - option→plain, plain→option
  - two options from different products, two options of the same product
  - plain→plain
  - quantity >1 on mixed lines
  - 3-line cart and the same cart reversed
  - option→plain→option
  - option with no price of its own (falls back to the product price)
  - product given by slug
- **Rejected carts**: unknown, foreign or inactive option and missing option give
  `SKXNZ_VARIANT_UNAVAILABLE`. Also:
  - over stock: `SKXNZ_OUT_OF_STOCK`
  - archived product: `SKXNZ_PRODUCT_UNAVAILABLE`
  - quantity 0 or 11, or a bad UUID: `SKXNZ_VALIDATION_FAILED`
  - another buyer's address: `SKXNZ_ADDRESS_NOT_FOUND`
  - a seller trying to buy: `SKXNZ_BUYER_REQUIRED`
- **Order idempotency**:
  - a replay with the same key returns the same order (`reused=true`), with 1 order and
    1 line for that key;
  - a changed payload with the same key gives `SKXNZ_IDEMPOTENCY_CONFLICT`;
  - another buyer sees 0 orders.
- **Seller fulfilment**:
  - PENDING→ACCEPTED works, and skipping a step gives `SKXNZ_INVALID_TRANSITION`;
  - a buyer calling it gives `SKXNZ_SELLER_REQUIRED`;
  - events are visible to the seller and the owning buyer, not to another buyer;
  - a forged direct event insert is denied (42501).
- **Admin orders**:
  - FULFILLING→SHIPPED→DELIVERED works; going backwards is rejected;
  - a buyer calling it gives `SKXNZ_ADMIN_REQUIRED`.
- **Returns** (previously 42702):
  - create works, and a replay is reused with the same id;
  - a changed payload gives `IDEMPOTENCY_CONFLICT`; over quantity gives `QUANTITY_EXCEEDED`;
    a duplicate item gives `VALIDATION_FAILED`;
  - **direct insert into `return_requests` / `return_request_items` is denied (42501)**;
  - another buyer gets `ORDER_NOT_FOUND`;
  - the seller indicator returns 1 for the seller and 0 for a non-seller;
  - admin review works and the reverse step is rejected.
- **Support**:
  - ticket create works, its replay is reused, and a changed payload is rejected;
  - message add works and its replay is reused;
  - a buyer sending as `ADMIN` is rejected;
  - another buyer gets `TICKET_NOT_FOUND` / `ORDER_NOT_FOUND`.
- **Saved items**:
  - a duplicate gives 23505; a forged owner and any update are denied (42501);
  - the owner sees 1, another buyer 0, admin 1;
  - anon is denied.
- **Privileges**: all 8 functions have anon EXECUTE false and authenticated true. RLS is on
  for both new tables. Grants: `saved_items` select/insert/delete; `order_item_events`,
  `return_requests`, `return_request_items` select only.
- **After the run**: live re-checked unchanged.
  - No new tables or functions.
  - No `zz0020-*` users or products.
  - Migration history still ends at 0019.
  - 0 orders.

Earlier runs, kept for the record:
1. Run 1 found defect 1 (42702).
2. Run 2 found defect 2.
3. Run 3 caught an ambiguous column in the new guard itself, fixed by qualifying it as
   `oi.order_id`.
4. Run 4 (md5 `2d1769c1…`) was green; founder review then found the issues in section 7a.

## 9. Security effect: closing direct buyer inserts into return requests

Today, live grants authenticated INSERT on `return_requests` and `return_request_items`, and
the 0005 policies let a signed-in buyer insert rows directly through the Data API. That
bypasses the server rules (delivered orders only, quantity limits, no duplicate claims,
length limits, audit event). It is low impact today only because there are no orders yet.

0020 (from 0008) revokes that INSERT and drops both insert policies. Return requests can then
only be created through `create_return_request_idempotent`, which locks the order, checks
ownership, delivery status and remaining quantity, and writes the request, its items and the
audit event in one transaction. Verified: direct inserts give 42501 after 0020.

If 0020 is delayed, a narrow hotfix with only those four 0008 statements (two revokes, two
policy drops) can close this path on its own. The current code never inserts into those
tables directly, so nothing else changes.

## 10. Still out of scope

- Admin INSERT/UPDATE/DELETE policies on brands/categories still use an inline `users`
  subquery.
- Untracked history rows for 0001-0016 (deliberately left as is).
- Supabase advisor warnings: `set_updated_at` search_path, leaked-password protection,
  SECURITY DEFINER functions callable by signed-in users (by design for these RPCs).
- No inventory decrement on order; payments (Razorpay) not wired. **Atomic stock
  decrement/revalidation is a hard prerequisite before real payment capture goes live.**

## 11. Production application record (2026-10-02 UTC)

- **Applied via** Supabase `apply_migration`, project `hhsorrkvgvxxpwzrggei`.
- **Exact bytes:** before applying, the file and the committed copy both hashed to
  `188e02c43c02fdde67cd8fa7fe1388b8` (LF, 0 CR). After applying, `md5(statements[1])` of the new
  history row is also `188e02c43c02fdde67cd8fa7fe1388b8`.
- **Migration history:** exactly one new row, `20261002204620 0020_reconcile_missing_commerce_objects`.
  The 0017-0019 rows are unchanged; 0001-0016 were not added or touched.
- **Objects:**
  - `saved_items` and `order_item_events`, both with RLS on.
  - All 8 RPCs, each SECURITY DEFINER with `search_path=public, pg_temp`.
  - 11 new columns, 9 indexes, 6 constraints (three 0008 checks NOT VALID as designed), the
    `saved_items_set_updated_at` trigger, and the expected policies and grants.
- **Security:**
  - Anon has EXECUTE on none of the 8 RPCs; authenticated has it on all 8.
  - Direct authenticated inserts into `return_requests` and `return_request_items` give 42501.
  - ADMIN and SELLER calling the three buyer RPCs get `BUYER_REQUIRED`.
  - Anon REST: `users`, `saved_items`, `return_requests` and the ticket RPC all give
    401/42501; brands 200 (11), categories 200 (6), ACTIVE products 200 (6).
  - The Supabase security advisor shows no new anon findings; the only new entries are the
    intended "authenticated can execute SECURITY DEFINER" notices for the 8 RPCs.
- **Commerce smoke** (live functions, synthetic users, forced rollback), all pass:
  - order create and retry;
  - mixed option/plain cart: 120000 + 50000 = 170000 subtotal and line sum;
  - seller ACCEPTED, then admin FULFILLING > SHIPPED > DELIVERED;
  - return REQUESTED, then admin IN_REVIEW;
  - ticket create/retry plus message;
  - saved items visible to the owner only;
  - anon RPC, `users` and `saved_items` give 42501.
- **App gates on live data:**
  - production build passes (82 pages, 0 catalogue errors), typecheck clean, lint 0 errors;
  - tests: commerce 173/173, catalogue 11/11, auth 35/35;
  - route smoke: public pages 200, archived QA product and unknown product 404, signed-in
    pages redirect to login, AI assistant 200, sitemap 6 products.
- **Live row counts after application:**
  - users 7, products 7 (6 ACTIVE), brands 11, categories 6;
  - every commerce table and `saved_items` / `order_item_events`: 0;
  - addresses 0; no test users or products left.
- **Unexpected finding, not caused by 0020 and not changed:** on `public.users`, anon holds
  TRUNCATE/TRIGGER/REFERENCES and authenticated holds TRUNCATE. These look like Supabase
  default table grants that were never revoked. The Data API does not expose TRUNCATE, but the
  grants should be removed in a separate, reviewed change.
- **Still required before real payment capture:** atomic stock revalidation/decrement at the
  payment or order boundary.
