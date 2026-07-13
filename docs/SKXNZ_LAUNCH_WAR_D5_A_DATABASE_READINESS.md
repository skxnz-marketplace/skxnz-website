# D5-A Database Readiness

Code is complete; 0008, 0009, 0010 and new 0011 are draft and unapplied. 0011 replaces sequential buyer order writes with authenticated `create_order_intent_atomic`: buyer identity, address, catalog price/status/variant stock, DRAFT status, order/items/event and retry key are controlled in PostgreSQL. Missing RPC returns `NOT_WIRED`; no fallback writes occur. Mock tests are application coverage, not live RLS or concurrency proof.

Audit found and repaired draft 0008's missing `return_request_items.reason` dependency and duplicate-item/deadlock ordering hazards. The local migration chain is not self-contained: catalog migration 0002 is absent and is a hard QA preflight gate.
