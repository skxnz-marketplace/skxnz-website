# D4-B Admin Commerce Atomic Hardening

Merge commit `ae34a08` integrated D3-B seller atomic fulfilment/return visibility with D4-A admin operations. D4-B replaces the two split privileged update-plus-audit boundaries with draft 0010 authenticated ADMIN RPCs: `admin_update_order_status_atomic` and `admin_update_return_status_atomic`.

Both use `auth.uid()`, ADMIN role verification, `SECURITY DEFINER`, `search_path = public, pg_temp`, row locks, bounded notes, transition validation, and one transaction for mutation plus `order_events` audit. Application actions have no service-role fallback and return `NOT_WIRED` for missing RPCs. Support reply/status actions were reviewed and left unchanged: neither has a split update-plus-audit path.

`0010` is draft/unapplied. The verification script asserts function existence, `SECURITY DEFINER`, `search_path`, effective `authenticated`-only execution, return signatures, checked-text status constraints, and all resource/audit columns. The isolation script records the required anon/BUYER/SELLER rejection, ADMIN success, invalid/repeated/stale/missing-resource, atomic-audit, attribution, forged-field, and two-session concurrency checks.

The automated commerce suite has 73 passing mocked application-level tests. It proves that both actions call only their named atomic RPCs, map missing function responses to `NOT_WIRED`, reject non-admin callers, and never send actor/payment/refund/unrelated update fields. It does not prove live RLS policy behavior or PostgreSQL lock contention: those require the disposable Supabase QA steps above.
