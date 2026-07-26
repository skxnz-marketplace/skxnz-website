// Core limiter. Transport-agnostic: no Next.js, no Supabase, no HTTP.
import { getRateLimitStore } from "./adapters";
import { buildRateLimitKey, subjectSatisfiesScope } from "./keys";
import { getPolicy, type RateLimitPolicyName } from "./policies";
import type { RateLimitPolicy, RateLimitResult, RateLimitStore, RateLimitSubject } from "./types";

export type ConsumeOptions = {
  /** Override the store. Tests use this; production never passes it. */
  store?: RateLimitStore;
  /** Override the clock. Tests use this to prove window expiry deterministically. */
  now?: number;
};

function allowResult(policy: RateLimitPolicy, remaining: number, resetAt: number, degraded: boolean): RateLimitResult {
  return {
    allowed: true,
    policy: policy.name,
    limit: policy.limit,
    remaining: Math.max(0, remaining),
    resetAt,
    retryAfterSeconds: 0,
    degraded,
  };
}

/**
 * Record one hit against `policy` for `subject` and report whether it is allowed.
 *
 * Never throws. A store failure resolves through the policy's `onStoreFailure`
 * setting, and a fail-open decision is always flagged `degraded: true` so no
 * caller can report "rate limited" protection that did not actually run.
 */
export async function consumeRateLimit(
  policyName: RateLimitPolicyName,
  subject: RateLimitSubject,
  options: ConsumeOptions = {},
): Promise<RateLimitResult> {
  const policy = getPolicy(policyName);
  const now = options.now ?? Date.now();
  const store = options.store ?? getRateLimitStore();

  // A policy counting an identity the request does not carry cannot limit
  // anything meaningfully — every such caller would collapse into one shared
  // bucket and a single abuser would lock out all of them. Allow, and mark it
  // degraded so the gap is visible rather than silent.
  if (!subjectSatisfiesScope(policy, subject)) {
    return allowResult(policy, policy.limit, now + policy.windowMs, true);
  }

  const key = buildRateLimitKey(policy, subject);

  let count: number;
  let resetAt: number;
  try {
    const outcome = await store.consume(key, policy.limit, policy.windowMs, now);
    count = outcome.count;
    resetAt = outcome.resetAt;
  } catch (error) {
    console.error(`[rate-limit] store failure on policy ${policy.name}:`, error);

    if (policy.onStoreFailure === "open") {
      return allowResult(policy, policy.limit, now + policy.windowMs, true);
    }

    // Fail closed: deny, and report a short retry so a transient blip does not
    // strand the user for a whole window.
    return {
      allowed: false,
      policy: policy.name,
      limit: policy.limit,
      remaining: 0,
      resetAt: now + 5_000,
      retryAfterSeconds: 5,
      degraded: true,
    };
  }

  if (count > policy.limit) {
    return {
      allowed: false,
      policy: policy.name,
      limit: policy.limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      degraded: false,
    };
  }

  return allowResult(policy, policy.limit - count, resetAt, false);
}
