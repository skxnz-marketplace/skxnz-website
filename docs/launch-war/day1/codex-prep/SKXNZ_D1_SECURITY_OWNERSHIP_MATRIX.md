# SKXNZ D1 Security Ownership Matrix

Baseline: `launch-war-july30` at `5cc722905e3ba095e0ab762af7e3515c08eb2e3b`.

Legend: allow/deny is expected behavior; app guard is the route/action/query guard; DB/RLS guard is the database backstop; leak expectation is what a denied actor should learn; severity is impact if broken.

| Resource/action | Unauthenticated visitor | Buyer A | Buyer B | Seller A | Seller B | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Buyer order list | Deny. Middleware redirects `/orders` to `/login?next=/orders`. RLS: no session. Leak: none. Test route. Severity High. | Allow own list. App: `getBuyerOrders()` uses session and `.eq("buyer_id", user.id)`. RLS: buyer select own. Leak: own only. Severity Critical. | Deny Buyer A rows. Empty, not error. RLS filters. Severity Critical. | Deny buyer list unless seller is also buyer of those rows. Leak: empty. Severity High. | Deny. Same. Severity High. | Allow all only via admin helpers/routes. RLS: `public.is_admin()`. Severity High. |
| Buyer order detail | Deny. Route redirects. Severity High. | Allow own detail. App: uuid shape + buyer filter. RLS own order/items/events. Severity Critical. | Deny Buyer A detail. Return missing/notFound, no existence leak. Severity Critical. | Deny parent order detail. Seller sees line queue only, no address/contact. Severity Critical. | Deny. Severity Critical. | Allow via admin detail. App admin gate + RLS admin. Severity High. |
| Create order intent | Deny. `createOrderIntent` requires auth. Severity Critical. | Allow own DRAFT only. Server refetches address/product/variant/prices. RLS own inserts. Severity Critical. | Cannot create as Buyer A; only own session. Forged buyer id ignored. Severity Critical. | No seller privilege; only as own buyer account. Severity High. | Same. Severity High. | Should not create arbitrary buyer order through buyer action. Review admin overreach. Severity High. |
| Create return | Deny. Requires auth. Severity Critical. | Allow own DELIVERED order/items only, status REQUESTED. App checks ownership, eligibility, quantities, prior claims. RLS own insert. Severity Critical. | Deny Buyer A order/items. Leak as not found. Severity Critical. | Deny unless seller is order buyer. Must not expose buyer order data. Severity Critical. | Deny. Severity Critical. | Admin must use admin returns action, not buyer action. Severity High. |
| View return | Deny account route. Severity High. | Allow own returns. RLS `return_requests: buyer can select own`. Severity Critical. | Deny Buyer A returns. Empty/missing. Severity Critical. | Deny unless seller is buyer. Severity High. | Deny. Severity High. | Allow via admin returns only. RLS admin manage all. Severity High. |
| Create support ticket | Deny. Requires auth. Severity High. | Allow own ticket; optional order link must be own order; status OPEN; sender BUYER. Severity Critical. | Deny linking Buyer A order. Leak as not found. Severity Critical. | Allow only as own buyer account; no seller staff power. Severity High. | Same. Severity High. | Admin staff path must be separate. Buyer action must not create staff messages. Severity High. |
| View support ticket | Deny account route. Severity High. | Allow own ticket thread. App filters buyer id; invalid/foreign notFound. RLS own ticket/messages. Severity Critical. | Deny Buyer A ticket. Leak same as missing. Severity Critical. | Deny unless ticket buyer. Severity High. | Deny. Severity High. | Allow via admin support only. RLS admin manage all. Severity High. |
| Add support message | Deny. Requires auth. Severity High. | Allow own active ticket only; `sender_role = BUYER`. Severity Critical. | Deny Buyer A ticket. Severity Critical. | Deny unless ticket buyer; no seller staff messages. Severity High. | Deny. Severity High. | Admin must not use buyer reply action for staff reply. Severity Critical. |
| Seller order list/detail | Deny unless logged in. Severity High. | Deny seller route unless role SELLER/ADMIN. Severity High. | Deny. Severity High. | Allow own post-payment product lines only. No parent order/address/contact/totals. RLS helper in `0006`. Severity Critical. | Deny Seller A lines. Severity Critical. | Admin may enter seller route, but UI must still avoid buyer detail leakage beyond line queue. Severity Medium. |
| Admin order list/detail | Deny. Middleware login. Severity Critical. | Deny wrong role. Home `?denied=role`, no data. Severity Critical. | Deny. Severity Critical. | Deny unless ADMIN. Severity Critical. | Deny. Severity Critical. | Allow all. App admin gate + `public.is_admin()`. Severity Critical. |
| Admin status actions | Deny. Requires auth. Severity Critical. | Deny. Role lookup must be ADMIN before service role. Severity Critical. | Deny. Severity Critical. | Deny. Severity Critical. | Deny. Severity Critical. | Allow only permitted transitions. Never set PAID/REFUNDED. Audit event. Severity Critical. |

## Cross-Cutting Expectations

- Foreign rows should look missing, not reveal owner identity.
- Sellers must never see buyer address, contact, payment fields, or full order totals.
- Admin service-role writes must be server-only and after role verification.
- `PAID` belongs only to a future signature-verified Razorpay webhook.
- Refund states belong only to a future provider-confirmed refund flow.
