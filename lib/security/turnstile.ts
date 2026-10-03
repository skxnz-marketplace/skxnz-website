import "server-only";
import { isDummyTurnstileKey, isLocalTurnstileContext, isTurnstileTestMode, turnstileSiteKey } from "@/lib/security/turnstile-public";
export { isTurnstileTestMode, turnstileSiteKey, captchaOptions } from "@/lib/security/turnstile-public";

// Cloudflare Turnstile — server-side Siteverify for non-auth callers only.
//
// SECURITY CONTRACT
//   * The secret (CLOUDFLARE_TURNSTILE_SECRET_KEY) is read ONLY here, in server
//     code. It must never reach the browser bundle — this module has no "use
//     client" and is never imported by a client component.
//   * Tokens are short-lived, single-use, and untrusted until Siteverify
//     returns success. We never log the token itself.
//   * Verification fails CLOSED: any network error, timeout, non-200, or a
//     malformed body is treated as "not human", never as a pass.
//
// TEST MODE
//   Cloudflare publishes always-pass/always-fail dummy keys for local dev. When
//   the configured keys are those dummies (or no keys are set at all and we
//   fall back to them), isTurnstileTestMode() is true. The UI surfaces this so
//   nobody mistakes local dev for real bot protection.

// Cloudflare's official testing keys (public, documented, safe to commit).
// Site key + secret that ALWAYS pass — for local/dev only.
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 8000;

/** Server-only secret. Dummy fallback is limited to explicit development/test. */
function turnstileSecretKey(): string {
  const key = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim();
  if (!key) return isLocalTurnstileContext() ? TEST_SECRET_KEY : "";
  return !isLocalTurnstileContext() && isDummyTurnstileKey(key) ? "" : key;
}

export type TurnstileVerifyResult =
  | { success: true; testMode: boolean }
  | { success: false; testMode: boolean; reason: string };

type SiteverifyBody = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

type VerifyOptions = {
  /** Caller IP (from x-forwarded-for) — optional but improves scoring. */
  remoteIp?: string | null;
  /**
   * Expected hostname. Enforced only in production (test mode / dummy keys
   * report a placeholder hostname, so enforcing it locally would fail-closed
   * on every dev submit).
   */
  expectedHostname?: string | null;
  /** Expected action, if the widget was rendered with an `action`. */
  expectedAction?: string | null;
};

/**
 * Verify a Turnstile token against Cloudflare Siteverify. Fails closed on any
 * error. Never logs the token. Returns a normalized result the caller maps to
 * user-facing copy.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  opts: VerifyOptions = {},
): Promise<TurnstileVerifyResult> {
  const testMode = isTurnstileTestMode();
  const secretKey = turnstileSecretKey();

  if (!turnstileSiteKey() || !secretKey) {
    return { success: false, testMode: false, reason: "configuration-error" };
  }

  if (!token || typeof token !== "string" || token.length > 4096) {
    return { success: false, testMode, reason: "missing-token" };
  }

  const form = new URLSearchParams();
  form.set("secret", secretKey);
  form.set("response", token);
  if (opts.remoteIp) form.set("remoteip", opts.remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SITEVERIFY_TIMEOUT_MS);

  let body: SiteverifyBody;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { success: false, testMode, reason: `siteverify-http-${res.status}` };
    }
    body = (await res.json()) as SiteverifyBody;
  } catch (err) {
    // Timeout or network failure — fail closed.
    const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "network-error";
    return { success: false, testMode, reason };
  } finally {
    clearTimeout(timer);
  }

  if (!body.success) {
    // Do not surface raw Cloudflare error codes to the user; keep them for logs.
    return { success: false, testMode, reason: "challenge-failed" };
  }

  // Production-only integrity checks. In test mode the dummy keys return a
  // placeholder hostname, so skipping these locally is correct, not a weakening.
  if (!testMode) {
    if (opts.expectedHostname && body.hostname && body.hostname !== opts.expectedHostname) {
      return { success: false, testMode, reason: "hostname-mismatch" };
    }
    if (opts.expectedAction && body.action && body.action !== opts.expectedAction) {
      return { success: false, testMode, reason: "action-mismatch" };
    }
  }

  return { success: true, testMode };
}
