// SKXNZ launch-war D12-B — rate-limit framework regression suite.
//
// These exercise the REAL framework source (compiled via tests/tsconfig.json)
// against an injected store and an injected clock, so window expiry is proven
// deterministically rather than by sleeping.
//
// What they intentionally do NOT claim: distributed protection. The shipped
// adapter is process-local and the capability assertion below pins that fact
// so a future "we are rate limited" claim cannot quietly become false.

require("./bootstrap.cjs");

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  consumeRateLimit,
  getRateLimiterCapability,
  RATE_LIMIT_POLICIES,
  listPolicies,
  getPolicy,
  buildRateLimitKey,
  subjectSatisfiesScope,
  createRateLimitedResponse,
} = require("@/lib/security/rate-limit/rate-limit");
const {
  createMemoryRateLimitStore,
} = require("@/lib/security/rate-limit/adapters/memory-store");

const BASE = 1_700_000_000_000;

function freshStore() {
  return createMemoryRateLimitStore();
}

// ---- Burst ----------------------------------------------------------------

test("burst: requests up to the limit pass and the next one is refused", async () => {
  const store = freshStore();
  const policy = getPolicy("support.ticket");
  const subject = { userId: "buyer-1" };

  for (let i = 1; i <= policy.limit; i += 1) {
    const result = await consumeRateLimit("support.ticket", subject, { store, now: BASE });
    assert.equal(result.allowed, true, `request ${i} should pass`);
    assert.equal(result.remaining, policy.limit - i);
    assert.equal(result.degraded, false);
  }

  const blocked = await consumeRateLimit("support.ticket", subject, { store, now: BASE });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.limit, policy.limit);
  assert.ok(blocked.retryAfterSeconds > 0, "a refused request must say when to retry");
});

test("burst refusal keeps refusing inside the same window", async () => {
  const store = freshStore();
  const subject = { userId: "buyer-burst" };
  const policy = getPolicy("returns.create");

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("returns.create", subject, { store, now: BASE });
  }
  for (let i = 0; i < 5; i += 1) {
    const result = await consumeRateLimit("returns.create", subject, { store, now: BASE + i });
    assert.equal(result.allowed, false, "repeated attempts must not sneak through");
  }
});

// ---- Window expiry --------------------------------------------------------

test("window expiry: the allowance returns after the window slides past", async () => {
  const store = freshStore();
  const policy = getPolicy("support.ticket");
  const subject = { userId: "buyer-2" };

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("support.ticket", subject, { store, now: BASE });
  }
  assert.equal(
    (await consumeRateLimit("support.ticket", subject, { store, now: BASE })).allowed,
    false,
  );

  // One millisecond past the window, the original hits have slid out.
  const after = await consumeRateLimit("support.ticket", subject, {
    store,
    now: BASE + policy.windowMs + 1,
  });
  assert.equal(after.allowed, true);
});

test("sliding window blocks the boundary burst a fixed window would allow", async () => {
  const store = freshStore();
  const policy = getPolicy("support.ticket");
  const subject = { userId: "buyer-boundary" };

  // Spend the whole allowance late in the window.
  const late = BASE + policy.windowMs - 10;
  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("support.ticket", subject, { store, now: late });
  }

  // A fixed window would reset here and allow a full second burst. The sliding
  // window still counts the recent hits, so this must be refused.
  const justAfterReset = BASE + policy.windowMs + 1;
  const result = await consumeRateLimit("support.ticket", subject, {
    store,
    now: justAfterReset,
  });
  assert.equal(result.allowed, false, "2x boundary burst must not be possible");
});

// ---- Per-user isolation ---------------------------------------------------

test("per-user: one buyer exhausting a limit does not affect another", async () => {
  const store = freshStore();
  const policy = getPolicy("support.ticket");

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("support.ticket", { userId: "buyer-a" }, { store, now: BASE });
  }
  assert.equal(
    (await consumeRateLimit("support.ticket", { userId: "buyer-a" }, { store, now: BASE })).allowed,
    false,
  );

  const other = await consumeRateLimit("support.ticket", { userId: "buyer-b" }, { store, now: BASE });
  assert.equal(other.allowed, true, "a second buyer must have their own allowance");
});

// ---- Per-IP isolation -----------------------------------------------------

test("per-ip: one network exhausting a limit does not affect another", async () => {
  const store = freshStore();
  const policy = getPolicy("search.suggest");

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("search.suggest", { ip: "203.0.113.10" }, { store, now: BASE });
  }
  assert.equal(
    (await consumeRateLimit("search.suggest", { ip: "203.0.113.10" }, { store, now: BASE })).allowed,
    false,
  );

  const other = await consumeRateLimit("search.suggest", { ip: "198.51.100.7" }, { store, now: BASE });
  assert.equal(other.allowed, true);
});

test("user+ip scope separates the same user arriving from a different network", async () => {
  const store = freshStore();
  const policy = getPolicy("ai.request");

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("ai.request", { userId: "u1", ip: "203.0.113.1" }, { store, now: BASE });
  }
  assert.equal(
    (await consumeRateLimit("ai.request", { userId: "u1", ip: "203.0.113.1" }, { store, now: BASE }))
      .allowed,
    false,
  );

  const moved = await consumeRateLimit(
    "ai.request",
    { userId: "u1", ip: "198.51.100.9" },
    { store, now: BASE },
  );
  assert.equal(moved.allowed, true, "user+ip is a pair, so a new network is a new bucket");
});

// ---- Scope satisfaction ---------------------------------------------------

test("a user-scoped policy cannot limit an anonymous caller and says so", async () => {
  const store = freshStore();
  const result = await consumeRateLimit("support.ticket", { userId: null }, { store, now: BASE });

  // Allowed, because bucketing every anonymous caller together would let one
  // abuser lock out all guests. Flagged degraded so the gap is never silent.
  assert.equal(result.allowed, true);
  assert.equal(result.degraded, true);
  assert.equal(subjectSatisfiesScope(getPolicy("support.ticket"), { userId: null }), false);
});

// ---- Store failure / fallback --------------------------------------------

test("limiter fallback: a failing store fails CLOSED for cost-bearing policies", async () => {
  const brokenStore = {
    kind: "broken",
    distributed: false,
    async consume() {
      throw new Error("store offline");
    },
    async reset() {},
  };

  assert.equal(getPolicy("ai.request").onStoreFailure, "closed");
  const result = await consumeRateLimit(
    "ai.request",
    { userId: "u1", ip: "203.0.113.5" },
    { store: brokenStore, now: BASE },
  );
  assert.equal(result.allowed, false, "AI spend must not continue unprotected");
  assert.equal(result.degraded, true, "a fallback decision must be reported as degraded");
  assert.ok(result.retryAfterSeconds > 0);
});

test("limiter fallback: a failing store fails OPEN for read-side policies", async () => {
  const brokenStore = {
    kind: "broken",
    distributed: false,
    async consume() {
      throw new Error("store offline");
    },
    async reset() {},
  };

  assert.equal(getPolicy("search.suggest").onStoreFailure, "open");
  const result = await consumeRateLimit(
    "search.suggest",
    { ip: "203.0.113.5" },
    { store: brokenStore, now: BASE },
  );
  assert.equal(result.allowed, true, "a limiter outage must not break browsing");
  assert.equal(result.degraded, true, "but it must never be reported as protected");
});

// ---- Policy selection -----------------------------------------------------

test("policy selection: each policy uses its own bucket", async () => {
  const store = freshStore();
  const subject = { userId: "buyer-multi", ip: "203.0.113.20" };
  const ticketPolicy = getPolicy("support.ticket");

  for (let i = 0; i < ticketPolicy.limit; i += 1) {
    await consumeRateLimit("support.ticket", subject, { store, now: BASE });
  }
  assert.equal(
    (await consumeRateLimit("support.ticket", subject, { store, now: BASE })).allowed,
    false,
  );

  // A different policy for the same subject is unaffected.
  const reply = await consumeRateLimit("support.reply", subject, { store, now: BASE });
  assert.equal(reply.allowed, true);
  assert.equal(reply.policy, "support.reply");
});

test("every policy is internally coherent", () => {
  for (const policy of listPolicies()) {
    assert.ok(policy.limit > 0, `${policy.name} needs a positive limit`);
    assert.ok(policy.windowMs > 0, `${policy.name} needs a positive window`);
    assert.ok(
      ["user", "ip", "user+ip"].includes(policy.scope),
      `${policy.name} has an unknown scope`,
    );
    assert.ok(
      ["closed", "open"].includes(policy.onStoreFailure),
      `${policy.name} has an unknown failure mode`,
    );
    assert.ok(policy.description.length > 10, `${policy.name} needs a real description`);
  }
});

test("cost-bearing and credential policies must fail closed", () => {
  for (const name of [
    "auth.signin",
    "auth.signup",
    "auth.recovery",
    "commerce.checkout",
    "ai.request",
    "support.ticket",
    "admin.mutation",
  ]) {
    assert.equal(
      getPolicy(name).onStoreFailure,
      "closed",
      `${name} must not fail open — it guards credentials, money, or external spend`,
    );
  }
});

// ---- Keys -----------------------------------------------------------------

test("keys are namespaced per policy and do not leak raw identity", () => {
  const ticketKey = buildRateLimitKey(getPolicy("support.ticket"), { userId: "buyer-secret" });
  const replyKey = buildRateLimitKey(getPolicy("support.reply"), { userId: "buyer-secret" });

  assert.notEqual(ticketKey, replyKey, "different policies must not share a bucket");
  assert.ok(ticketKey.startsWith("rl:support.ticket:"));
  assert.equal(
    ticketKey.includes("buyer-secret"),
    false,
    "the raw user id must never appear in a storage key",
  );
});

test("ip normalisation maps loopback forms onto one bucket", () => {
  const policy = getPolicy("search.suggest");
  assert.equal(
    buildRateLimitKey(policy, { ip: "::1" }),
    buildRateLimitKey(policy, { ip: "127.0.0.1" }),
  );
  assert.equal(
    buildRateLimitKey(policy, { ip: "::ffff:203.0.113.4" }),
    buildRateLimitKey(policy, { ip: "203.0.113.4" }),
  );
});

// ---- HTTP surface ---------------------------------------------------------

test("a refused route handler returns a truthful 429 with Retry-After", async () => {
  const store = freshStore();
  const policy = getPolicy("search.suggest");
  const subject = { ip: "203.0.113.44" };

  for (let i = 0; i < policy.limit; i += 1) {
    await consumeRateLimit("search.suggest", subject, { store, now: BASE });
  }
  const blocked = await consumeRateLimit("search.suggest", subject, { store, now: BASE });
  const response = createRateLimitedResponse(blocked);

  assert.equal(response.status, 429);
  assert.ok(response.headers.get("Retry-After"), "clients need Retry-After to back off");
  assert.equal(response.headers.get("RateLimit-Limit"), String(policy.limit));

  const body = await response.json();
  assert.equal(body.code, "RATE_LIMITED");
  assert.match(body.message, /Try again in/);
  // No fake success and no silent empty payload.
  assert.equal(body.ok, undefined);
});

// ---- Truthful capability --------------------------------------------------

test("the framework does not claim distributed protection it does not have", () => {
  const capability = getRateLimiterCapability();
  assert.equal(capability.storeKind, "memory");
  assert.equal(capability.distributed, false);
  assert.match(capability.guarantee, /Process-local only/);
  assert.match(capability.guarantee, /not distributed protection/);
});

test("no limit numbers are hardcoded outside the policy registry", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const wired = [
    "lib/support/create-support-ticket.ts",
    "lib/support/add-support-ticket-message.ts",
    "lib/returns/create-return-request.ts",
    "lib/orders/create-order-intent.ts",
    "lib/data/address-actions.ts",
  ];
  for (const file of wired) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    // Call sites name a policy; they must never pass a raw limit or window.
    assert.equal(
      /guardServerAction\([^)]*\b(limit|windowMs)\b/.test(source),
      false,
      `${file} passes a raw limit instead of naming a policy`,
    );
    assert.match(source, /guardServerAction\("[a-z.]+"/, `${file} must name a policy`);
  }
  assert.ok(Object.keys(RATE_LIMIT_POLICIES).length >= 10);
});
