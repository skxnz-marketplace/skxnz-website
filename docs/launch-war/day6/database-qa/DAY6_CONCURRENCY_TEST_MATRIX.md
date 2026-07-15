# Day 6 concurrency and isolation test matrix

| Scenario | Actors | Expected result |
| --- | --- | --- |
| Seller line mutation | Seller A and Seller B on separate lines in shared order | Each can see/mutate only owned eligible line; no order-wide mutation. |
| Seller race | Two Seller A requests for same line transition | One transition succeeds; repeat/stale transition is rejected; one attributed event. |
| Admin order race | Admin A and Admin B request different next states from same current order state | Row lock/current-state recheck permits one allowed transition and rejects stale/invalid successor. |
| Admin return race | Admin A and Admin B update one return | One allowed transition and one audit event; stale request rejected. |
| Buyer idempotency retry | Same buyer repeats same key and compatible payload | Same DRAFT order result is reused. |
| Buyer key conflict | Same buyer reuses key with changed payload | Explicit idempotency conflict; no extra order/items. |
| Buyer stock race | Buyers compete for constrained active variant | Never report an order success without the atomic RPC result; record database outcome. |

Use separate authenticated sessions and the shipped isolation scripts where available. These exercises are required before a live readiness claim.
