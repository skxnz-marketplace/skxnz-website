// SINGLE SOURCE OF TRUTH for every rate limit in SKXNZ.
//
// Rules for this file:
//   * No limit number appears anywhere else in the codebase. Call sites name a
//     policy; they never pass raw counts or windows.
//   * Every policy carries a description, because a bare number is unreviewable.
//   * Anything spending money, external API quota, or granting access fails
//     CLOSED. Read-side conveniences fail OPEN so an adapter outage cannot take
//     the storefront down.
import type { RateLimitPolicy } from "./types";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

function policy(p: RateLimitPolicy): RateLimitPolicy {
  return Object.freeze(p);
}

export const RATE_LIMIT_POLICIES = {
  // ── Authentication ──────────────────────────────────────────────────────
  // Credential endpoints are the enumeration and password-spray surface.
  // Counted per user+ip so neither a single account nor a single network can
  // be hammered, and failing closed is mandatory.
  "auth.signin": policy({
    name: "auth.signin",
    limit: 8,
    windowMs: 10 * MINUTE,
    scope: "user+ip",
    onStoreFailure: "closed",
    description: "Sign-in attempts. Blunts password spraying and credential stuffing.",
  }),
  "auth.signup": policy({
    name: "auth.signup",
    limit: 5,
    windowMs: HOUR,
    scope: "ip",
    onStoreFailure: "closed",
    description: "Account creation per network. Blunts bulk fake-account registration.",
  }),
  "auth.recovery": policy({
    name: "auth.recovery",
    limit: 5,
    windowMs: HOUR,
    scope: "user+ip",
    onStoreFailure: "closed",
    description: "Password reset / OTP requests. Blunts mail-bombing and account enumeration.",
  }),

  // ── Commerce ────────────────────────────────────────────────────────────
  // Checkout writes rows and (later) money. Tight, per-user, fail closed.
  "commerce.checkout": policy({
    name: "commerce.checkout",
    limit: 10,
    windowMs: 5 * MINUTE,
    scope: "user+ip",
    onStoreFailure: "closed",
    description: "Draft order creation. Backstops the idempotency key against retry storms.",
  }),
  "commerce.address": policy({
    name: "commerce.address",
    limit: 30,
    windowMs: 10 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Address create/update/delete/default. Caps address-table flooding.",
  }),
  "commerce.wishlist": policy({
    name: "commerce.wishlist",
    limit: 60,
    windowMs: MINUTE,
    scope: "user",
    onStoreFailure: "open",
    description: "Saved-item toggles. Generous — real users toggle fast while browsing.",
  }),

  // ── Support and returns ─────────────────────────────────────────────────
  // Each write creates a durable row a human has to read. Spam control.
  "support.ticket": policy({
    name: "support.ticket",
    limit: 5,
    windowMs: HOUR,
    scope: "user",
    onStoreFailure: "closed",
    description: "New support tickets per buyer. Stops queue flooding.",
  }),
  "support.reply": policy({
    name: "support.reply",
    limit: 20,
    windowMs: 10 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Replies on support threads. Allows real conversation, stops spam.",
  }),
  "returns.create": policy({
    name: "returns.create",
    limit: 10,
    windowMs: HOUR,
    scope: "user",
    onStoreFailure: "closed",
    description: "Return requests per buyer. Backstops the idempotency key.",
  }),

  // ── Seller ──────────────────────────────────────────────────────────────
  "seller.product.write": policy({
    name: "seller.product.write",
    limit: 30,
    windowMs: 10 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Seller product create/update. Caps catalogue flooding by one seller.",
  }),
  "seller.fulfilment": policy({
    name: "seller.fulfilment",
    limit: 120,
    windowMs: 10 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Per-line fulfilment transitions. High — bulk order processing is legitimate.",
  }),

  // ── Admin ───────────────────────────────────────────────────────────────
  // Admins are trusted but not unlimited: a stolen admin session should not be
  // able to rewrite the whole order table in seconds.
  "admin.mutation": policy({
    name: "admin.mutation",
    limit: 120,
    windowMs: 5 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Admin order/return/support mutations. Caps blast radius of a stolen session.",
  }),

  // ── AI ──────────────────────────────────────────────────────────────────
  // Every call can spend third-party quota. Strictest cost-bearing surface.
  "ai.request": policy({
    name: "ai.request",
    limit: 20,
    windowMs: 10 * MINUTE,
    scope: "user+ip",
    onStoreFailure: "closed",
    description: "AI assistant/stylist calls. Protects third-party spend and compute.",
  }),

  // ── Search and public read ──────────────────────────────────────────────
  // Unauthenticated. IP-scoped, generous, fails open: a limiter problem must
  // never break browsing.
  "search.suggest": policy({
    name: "search.suggest",
    limit: 60,
    windowMs: MINUTE,
    scope: "ip",
    onStoreFailure: "open",
    description: "Typeahead suggestions. Per-keystroke traffic, so the ceiling is high.",
  }),
  "public.read": policy({
    name: "public.read",
    limit: 240,
    windowMs: MINUTE,
    scope: "ip",
    onStoreFailure: "open",
    description: "Generic unauthenticated read fallback for future public endpoints.",
  }),

  // ── Community ───────────────────────────────────────────────────────────
  "community.post": policy({
    name: "community.post",
    limit: 10,
    windowMs: HOUR,
    scope: "user",
    onStoreFailure: "closed",
    description: "Community posting. Invite-only (community_poster_grants) — still capped per poster.",
  }),
  "community.engage": policy({
    name: "community.engage",
    limit: 60,
    windowMs: MINUTE,
    scope: "user",
    onStoreFailure: "open",
    description: "Like/save toggles on community posts. Generous, same shape as commerce.wishlist — real users toggle fast while browsing.",
  }),
  "community.report": policy({
    name: "community.report",
    limit: 10,
    windowMs: HOUR,
    scope: "user",
    onStoreFailure: "closed",
    description: "Community post reports. Tight — stops one account from flooding the moderation queue.",
  }),
  "community.admin": policy({
    name: "community.admin",
    limit: 120,
    windowMs: 5 * MINUTE,
    scope: "user",
    onStoreFailure: "closed",
    description: "Admin community moderation (grant/revoke posting rights, resolve reports, hide/delete posts). Same ceiling as admin.mutation.",
  }),
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

export function getPolicy(name: RateLimitPolicyName): RateLimitPolicy {
  const found = RATE_LIMIT_POLICIES[name];
  if (!found) {
    // Unreachable through the type system; guards against a bad dynamic lookup.
    throw new Error(`Unknown rate-limit policy: ${String(name)}`);
  }
  return found;
}

export function listPolicies(): RateLimitPolicy[] {
  return Object.values(RATE_LIMIT_POLICIES);
}
