# D1-B Codex hardening review

Source: Claude commit 5cc722905e3ba095e0ab762af7e3515c08eb2e3b. Prep commit c0cb8eda13bf6274c71d6185e6ee85312852467d was cherry-picked because it contained only review docs and readiness scripts.

Confirmed hardening: return input validation is now unknown-safe, rejects malformed shapes without throwing, bounds per-item reasons, and preserves positive-integer quantity checks. A draft 0008 migration documents the required database boundary: revoke direct buyer inserts and add length constraints. No live SQL was executed.

Completed in the final D1-B slice: admin returns/support server reads, routes, and role-checked actions; the atomic SECURITY DEFINER RPC draft with privilege boundary; malformed-payload regression coverage. The migration remains unapplied by instruction, so live database verification is an operator prerequisite. This commit does not claim refunds, pickups, payment capture, or live fulfilment.

