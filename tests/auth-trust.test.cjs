// Auth / Turnstile / consent application-layer tests.
// Run with:  pnpm run test:auth
//
// Pure logic only — no network, no Supabase, no DOM. Covers the security
// contracts: open-redirect rejection, enumeration-safe error normalization,
// Turnstile fail-closed verification, and strict consent parsing/versioning.

require("./bootstrap.cjs");

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { safeNextPath, safeRedirectUrl } = require("@/lib/auth/safe-redirect");
const {
  normalizeAuthError,
  ENUMERATION_SAFE_SIGNUP,
  ENUMERATION_SAFE_RESET,
} = require("@/lib/auth/auth-errors");
const {
  parseConsent,
  buildConsentRecord,
  defaultCategories,
  allOnCategories,
  rejectOptionalCategories,
  isCategoryGranted,
  hasValidConsent,
  serializeConsent,
  consentCookieAttributes,
  CONSENT_VERSION,
} = require("@/lib/consent/consent");
const {
  verifyTurnstileToken,
  isTurnstileTestMode,
  turnstileSiteKey,
  captchaOptions,
} = require("@/lib/security/turnstile");
const { canRun, hasInstalledOptionalIntegrations } = require("@/lib/consent/script-gate");

// ---------------- safe-redirect ----------------

test("safeNextPath: keeps a normal root-relative path", () => {
  assert.equal(safeNextPath("/account/orders"), "/account/orders");
});

test("safeNextPath: rejects absolute external URLs", () => {
  assert.equal(safeNextPath("https://evil.com"), "/");
  assert.equal(safeNextPath("http://evil.com/x"), "/");
});

test("safeNextPath: rejects protocol-relative //host", () => {
  assert.equal(safeNextPath("//evil.com"), "/");
});

test("safeNextPath: rejects backslash folding tricks", () => {
  assert.equal(safeNextPath("/\\evil.com"), "/");
  assert.equal(safeNextPath("\\\\evil.com"), "/");
});

test("safeNextPath: rejects control chars and schemes", () => {
  assert.equal(safeNextPath("/foo\nbar"), "/");
  assert.equal(safeNextPath("/javascript:alert(1)"), "/");
});

test("safeNextPath: empty / null / oversized -> /", () => {
  assert.equal(safeNextPath(""), "/");
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath("/" + "a".repeat(3000)), "/");
});

test("safeRedirectUrl: composes origin + safe path only", () => {
  assert.equal(safeRedirectUrl("https://skxnz.app", "/account"), "https://skxnz.app/account");
  assert.equal(safeRedirectUrl("https://skxnz.app", "https://evil.com"), "https://skxnz.app/");
});

// ---------------- auth-errors (enumeration-safe) ----------------

test("normalizeAuthError: wrong password and unknown account map identically", () => {
  const wrong = normalizeAuthError({ message: "Invalid login credentials" });
  const missing = normalizeAuthError({ message: "User not found" });
  assert.equal(wrong.code, "invalid_credentials");
  assert.equal(missing.code, "invalid_credentials");
  assert.equal(wrong.message, missing.message); // no enumeration
});

test("normalizeAuthError: never returns raw provider text", () => {
  const r = normalizeAuthError({ message: "AuthApiError: secret internal detail 500" });
  assert.equal(r.code, "unknown");
  assert.ok(!/secret internal detail/i.test(r.message));
});

test("normalizeAuthError: classifies confirmed/rate/captcha", () => {
  assert.equal(normalizeAuthError({ message: "Email not confirmed" }).code, "email_not_confirmed");
  assert.equal(normalizeAuthError({ status: 429 }).code, "rate_limited");
  assert.equal(normalizeAuthError({ message: "captcha verification failed" }).code, "captcha_failed");
});

test("enumeration-safe copy exists for signup and reset", () => {
  assert.ok(ENUMERATION_SAFE_SIGNUP.length > 0);
  assert.ok(ENUMERATION_SAFE_RESET.length > 0);
});

// ---------------- consent ----------------

test("defaultCategories: every optional category is OFF, necessary ON", () => {
  const c = defaultCategories();
  assert.equal(c.necessary, true);
  assert.equal(c.preferences, false);
  assert.equal(c.analytics, false);
  assert.equal(c.marketing, false);
});

test("buildConsentRecord: forces necessary true even if asked false", () => {
  const rec = buildConsentRecord({ necessary: false, analytics: true }, "2026-07-30T00:00:00Z");
  assert.equal(rec.categories.necessary, true);
  assert.equal(rec.categories.analytics, true);
  assert.equal(rec.version, CONSENT_VERSION);
});

test("parseConsent: round-trips a valid record", () => {
  const rec = buildConsentRecord(allOnCategories(), "2026-07-30T00:00:00Z");
  const parsed = parseConsent(serializeConsent(rec));
  assert.ok(parsed);
  assert.equal(parsed.categories.marketing, true);
});

test("parseConsent: rejects corrupted JSON", () => {
  assert.equal(parseConsent("{not json"), null);
  assert.equal(parseConsent(""), null);
  assert.equal(parseConsent(null), null);
});

test("parseConsent: rejects an older consent version (forces re-decision)", () => {
  const stale = encodeURIComponent(
    JSON.stringify({ version: 0, timestamp: "2026-01-01T00:00:00Z", categories: defaultCategories() }),
  );
  assert.equal(parseConsent(stale), null);
});

test("parseConsent: rejects a record missing a category field", () => {
  const bad = encodeURIComponent(
    JSON.stringify({ version: CONSENT_VERSION, timestamp: "2026-01-01T00:00:00Z", categories: { necessary: true } }),
  );
  assert.equal(parseConsent(bad), null);
});

test("isCategoryGranted: undecided grants only necessary", () => {
  assert.equal(isCategoryGranted(null, "necessary"), true);
  assert.equal(isCategoryGranted(null, "analytics"), false);
  assert.equal(isCategoryGranted(null, "marketing"), false);
});

test("isCategoryGranted: reflects a stored reject-optional decision", () => {
  const rec = serializeConsent(buildConsentRecord(rejectOptionalCategories(), "2026-07-30T00:00:00Z"));
  assert.equal(hasValidConsent(rec), true);
  assert.equal(isCategoryGranted(rec, "analytics"), false);
  assert.equal(isCategoryGranted(rec, "necessary"), true);
});

test("consentCookieAttributes: production is Secure + SameSite=Lax, not HttpOnly", () => {
  const attrs = consentCookieAttributes(true);
  assert.match(attrs, /SameSite=Lax/);
  assert.match(attrs, /Secure/);
  assert.match(attrs, /Path=\//);
  assert.ok(!/HttpOnly/i.test(attrs)); // client must read it
});

// ---------------- turnstile (fail closed) ----------------

test("isTurnstileTestMode: true when keys are unset", () => {
  delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  assert.equal(isTurnstileTestMode(), true);
  assert.ok(turnstileSiteKey().length > 0);
});

test("verifyTurnstileToken: missing token fails without any network call", async () => {
  let fetched = false;
  const orig = global.fetch;
  global.fetch = async () => {
    fetched = true;
    return { ok: true, json: async () => ({ success: true }) };
  };
  try {
    const r = await verifyTurnstileToken(null);
    assert.equal(r.success, false);
    assert.equal(fetched, false);
  } finally {
    global.fetch = orig;
  }
});

test("verifyTurnstileToken: oversized token rejected pre-network", async () => {
  const r = await verifyTurnstileToken("x".repeat(5000));
  assert.equal(r.success, false);
});

test("verifyTurnstileToken: passes on Siteverify success", async () => {
  const orig = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ success: true, hostname: "localhost" }) });
  try {
    const r = await verifyTurnstileToken("dummy-token");
    assert.equal(r.success, true);
  } finally {
    global.fetch = orig;
  }
});

test("verifyTurnstileToken: fails closed on network error", async () => {
  const orig = global.fetch;
  global.fetch = async () => {
    throw new Error("network down");
  };
  try {
    const r = await verifyTurnstileToken("dummy-token");
    assert.equal(r.success, false);
    assert.equal(r.reason, "network-error");
  } finally {
    global.fetch = orig;
  }
});

test("verifyTurnstileToken: fails closed when Siteverify says success:false", async () => {
  const orig = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) });
  try {
    const r = await verifyTurnstileToken("dummy-token");
    assert.equal(r.success, false);
    assert.equal(r.reason, "challenge-failed");
  } finally {
    global.fetch = orig;
  }
});

test("verifyTurnstileToken: production hostname mismatch fails closed", async () => {
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = "0xREALKEY";
  process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = "0xREALSECRET";
  const orig = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ success: true, hostname: "evil.com" }) });
  try {
    const r = await verifyTurnstileToken("dummy-token", { expectedHostname: "skxnz.app" });
    assert.equal(r.success, false);
    assert.equal(r.reason, "hostname-mismatch");
  } finally {
    global.fetch = orig;
    delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
    delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  }
});

// ---------------- captchaToken forwarding ----------------

test("captchaOptions: forwards a present token as captchaToken", () => {
  assert.deepEqual(captchaOptions("tok123"), { captchaToken: "tok123" });
});

test("captchaOptions: omits captchaToken when no token (spreadable {})", () => {
  assert.deepEqual(captchaOptions(null), {});
  assert.deepEqual(captchaOptions(undefined), {});
  assert.deepEqual(captchaOptions(""), {});
});

// ---------------- script gating ----------------

test("canRun: necessary always allowed; optionals denied when undecided", () => {
  assert.equal(canRun(null, "necessary"), true);
  assert.equal(canRun(null, "analytics"), false);
  assert.equal(canRun(null, "marketing"), false);
});

test("canRun: optional allowed only after an explicit stored grant", () => {
  const consent = encodeURIComponent(
    JSON.stringify(buildConsentRecord(allOnCategories(), "2026-07-30T00:00:00Z")),
  );
  assert.equal(canRun(consent, "analytics"), true);
  assert.equal(canRun(consent, "marketing"), true);
});

test("canRun: corrupt consent denies optional (fail safe)", () => {
  assert.equal(canRun("{garbage", "analytics"), false);
});

test("no optional integrations are installed (truthful scaffold)", () => {
  assert.equal(hasInstalledOptionalIntegrations(), false);
});
