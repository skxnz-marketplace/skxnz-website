// Storage key construction.
//
// Two properties matter:
//   1. Keys must not collide across policies (namespaced by policy name).
//   2. Keys must not leak identity into logs or a future shared store. User ids
//      and IPs are hashed, so an operator reading the key space cannot recover
//      who was limited.
import { createHash } from "node:crypto";

import type { RateLimitPolicy, RateLimitSubject } from "./types";

/** Truncated SHA-256. 20 hex chars is ample against collision at this scale. */
function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 20);
}

/** Marker used when a scope component is unavailable. */
const ABSENT = "none";

function normalizeIp(ip: string | null | undefined): string {
  const trimmed = (ip ?? "").trim();
  if (!trimmed) return ABSENT;
  // IPv6 loopback/mapped forms normalise so one client is one bucket.
  if (trimmed === "::1" || trimmed === "::ffff:127.0.0.1") return "127.0.0.1";
  if (trimmed.startsWith("::ffff:")) return trimmed.slice(7);
  return trimmed.toLowerCase();
}

function normalizeUser(userId: string | null | undefined): string {
  const trimmed = (userId ?? "").trim();
  return trimmed ? trimmed.toLowerCase() : ABSENT;
}

/**
 * Whether the subject carries the identity this policy counts against.
 *
 * A "user"-scoped policy applied to an anonymous caller cannot limit anything
 * meaningfully — every anonymous request would share one `none` bucket and lock
 * out all guests at once. Callers must detect this and either authenticate
 * first or pair the call with an ip-scoped policy.
 */
export function subjectSatisfiesScope(
  policy: RateLimitPolicy,
  subject: RateLimitSubject,
): boolean {
  const hasUser = normalizeUser(subject.userId) !== ABSENT;
  const hasIp = normalizeIp(subject.ip) !== ABSENT;

  if (policy.scope === "user") return hasUser;
  if (policy.scope === "ip") return hasIp;
  return hasUser || hasIp;
}

export function buildRateLimitKey(
  policy: RateLimitPolicy,
  subject: RateLimitSubject,
): string {
  const user = normalizeUser(subject.userId);
  const ip = normalizeIp(subject.ip);

  let identity: string;
  if (policy.scope === "user") identity = `u:${user}`;
  else if (policy.scope === "ip") identity = `i:${ip}`;
  else identity = `u:${user}|i:${ip}`;

  const discriminator = (subject.discriminator ?? "").trim();
  if (discriminator) identity += `|d:${discriminator.toLowerCase()}`;

  return `rl:${policy.name}:${shortHash(identity)}`;
}
