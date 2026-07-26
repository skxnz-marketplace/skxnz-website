// Shared contracts for the SKXNZ rate-limit framework.
//
// Nothing in here imports Next.js, Supabase, or any storage engine. The core
// stays transport-agnostic so the same policy can guard a Server Action, a
// Route Handler, or a future background worker.

/** A named limit. Policies live in policies.ts and are never inlined at call sites. */
export type RateLimitPolicy = {
  /** Stable identifier, also used as the storage key namespace. */
  readonly name: string;
  /** Maximum number of permitted requests inside the window. */
  readonly limit: number;
  /** Sliding window length in milliseconds. */
  readonly windowMs: number;
  /**
   * What identity the limit is counted against.
   * - "user"      : authenticated subject only. Requests with no subject are NOT limited
   *                 by this policy and must be paired with an ip-scoped policy.
   * - "ip"        : network origin only.
   * - "user+ip"   : the pair, so one user on many networks and one network with many
   *                 accounts are both constrained.
   */
  readonly scope: "user" | "ip" | "user+ip";
  /**
   * Behaviour when the limiter itself errors (a future distributed adapter losing
   * its backend, for example).
   * - "closed" : deny the request. Correct for auth and anything that spends money
   *              or external quota.
   * - "open"   : allow the request. Correct for read-side conveniences where an
   *              outage should not take the feature down.
   * The in-process adapter cannot fail, so today this only documents intent —
   * it becomes load-bearing the moment a network-backed adapter is added.
   */
  readonly onStoreFailure: "closed" | "open";
  /** Human-readable reason, surfaced in docs and in the audit table. */
  readonly description: string;
};

/** Outcome of a single limiter consultation. */
export type RateLimitResult = {
  readonly allowed: boolean;
  /** Policy that produced this decision. */
  readonly policy: string;
  /** Requests still available in the current window (never negative). */
  readonly remaining: number;
  /** Configured ceiling, echoed for response headers. */
  readonly limit: number;
  /** Epoch ms at which the window frees up. */
  readonly resetAt: number;
  /** Whole seconds the caller should wait. 0 when allowed. */
  readonly retryAfterSeconds: number;
  /**
   * True when the decision was made without consulting the store because the
   * store failed and the policy fails open. Surfaced so callers never report
   * "protected" when protection was skipped.
   */
  readonly degraded: boolean;
};

/** Identity a request is counted against. Any field may be absent. */
export type RateLimitSubject = {
  /** Authenticated user id. Never taken from client input. */
  readonly userId?: string | null;
  /** Caller network address, already parsed from proxy headers. */
  readonly ip?: string | null;
  /** Optional extra dimension, e.g. a ticket id for per-thread reply limits. */
  readonly discriminator?: string | null;
};

/**
 * Storage contract. Implementations must be atomic per key: two concurrent
 * consume() calls for the same key must not both observe the pre-increment count.
 */
export type RateLimitStore = {
  /** Identifier used in diagnostics, e.g. "memory". */
  readonly kind: string;
  /**
   * True only when the backing store is shared across every process and region
   * serving traffic. The in-process adapter reports false, and the framework
   * refuses to describe itself as distributed while this is false.
   */
  readonly distributed: boolean;
  /**
   * Atomically record one hit against `key` and report the resulting state.
   * Implementations must expire entries at or after `windowMs`.
   */
  consume(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<{ count: number; resetAt: number }>;
  /** Test/maintenance hook. Clears all state. */
  reset(): Promise<void>;
};

/** What the framework can honestly claim about itself at runtime. */
export type RateLimiterCapability = {
  readonly storeKind: string;
  readonly distributed: boolean;
  /**
   * Plain-language statement of the protection actually in force. Written for
   * docs, health endpoints, and incident review — never marketing copy.
   */
  readonly guarantee: string;
};
