# D5-A Database Readiness

Code is complete; 0008, 0009, 0010 and new 0011 are draft and unapplied. 0011 replaces sequential buyer order writes with authenticated `create_order_intent_atomic`: buyer identity, address, catalog price/status/variant stock, DRAFT status, order/items/event and retry key are controlled in PostgreSQL. Missing RPC returns `NOT_WIRED`; no fallback writes occur. Mock tests are application coverage, not live RLS or concurrency proof.

The commerce suite increased from 74 to 78 registered tests: explicit valid-RPC-only, missing-RPC, retry/conflict, and no-fallback/forged-field regressions were added. The retry and conflict mocks prove action result mapping only; the 0011 two-session disposable-QA harness remains required for PostgreSQL uniqueness/locking proof.

Audit found and repaired draft 0008's missing `return_request_items.reason` dependency and duplicate-item/deadlock ordering hazards. Canonical 0002 recovery was attempted across all local history, Day-2 refs, reflogs, worktrees and dangling objects; only historical verification reports were found, not the SQL blob. The local migration chain is not self-contained: see `database-qa/CATALOG_BASELINE_RECOVERY_BLOCKER.md`. This is a Critical integration blocker.
