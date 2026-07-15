# D9-A launch gate matrix

| Area | Gate | Evidence / limitation |
| --- | --- | --- |
| Buyer browsing | YELLOW | Static routes and source checks exist; catalog baseline and browser QA remain pending. |
| Cart | YELLOW | Client cart flow exists; browser/mobile proof is pending. |
| Checkout draft order | RED | Atomic contract exists, but canonical catalog/database QA and authenticated smoke are pending. |
| Payment | BLACK | No live payment integration. |
| Delivery | BLACK | No delivery-provider integration. |
| Returns | YELLOW | Request/review boundaries exist; no live refund execution or end-to-end delivered-order proof. |
| Support | YELLOW | Scoped support surfaces exist; no SLA/email-notification claim. |
| Account/orders | YELLOW | Scoped routes exist; authenticated browser QA is pending. |
| Seller orders | RED | Draft 0009 needs disposable/live QA before operational use. |
| Admin operations | RED | Draft 0010 atomic actions need disposable/live QA before operational use. |
| Database migrations | RED | Canonical `0002_catalog_layer.sql` remains unrecovered. |
| Supabase fresh bootstrap | RED | Disposable Supabase QA is incomplete. |
| Vercel build | RED | No native Vercel/Linux successful-build evidence. |
| Mobile UI | RED | Authenticated/mobile browser smoke remains pending. |
| Buyer visual quality | RED | Founder reports the buyer experience regressed; recovery sprint is required. |

There is no GREEN end-to-end launch gate. GREEN labels on isolated informational copy do not authorize launch.
