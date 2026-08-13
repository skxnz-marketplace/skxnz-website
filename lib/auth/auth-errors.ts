// Normalize raw Supabase auth errors into safe, user-facing copy.
//
// Two goals:
//   1. Never leak raw provider strings, stack detail, or status codes to the UI.
//   2. Never enable account enumeration — sign-in and password-reset responses
//      must not reveal whether an email is registered. Wrong-password and
//      no-such-account both map to ONE generic credential message; forgot-
//      password always returns the same generic "if it exists, we sent it".

export type NormalizedAuthError = {
  /** Safe message to show the user. */
  message: string;
  /** Stable code for tests / conditional UI, never shown raw to the user. */
  code:
    | "invalid_credentials"
    | "email_not_confirmed"
    | "rate_limited"
    | "weak_password"
    | "captcha_failed"
    | "network"
    | "unknown";
};

const GENERIC_CREDENTIALS =
  "That email or password doesn't match an account. Check both and try again.";

export function normalizeAuthError(raw: unknown): NormalizedAuthError {
  const message = extractMessage(raw).toLowerCase();

  // Wrong password AND unknown-account collapse to one message (no enumeration).
  if (/invalid login credentials|invalid credentials|user not found|no user/.test(message)) {
    return { code: "invalid_credentials", message: GENERIC_CREDENTIALS };
  }
  if (/email not confirmed|email.*not.*verified|not confirmed/.test(message)) {
    return {
      code: "email_not_confirmed",
      message:
        "Confirm your email first — open the link we sent, then sign in.",
    };
  }
  if (/rate limit|too many requests|429/.test(message)) {
    return {
      code: "rate_limited",
      message: "Too many attempts. Wait a minute and try again.",
    };
  }
  if (/password.*(weak|short|least|character)|weak password/.test(message)) {
    return {
      code: "weak_password",
      message: "Choose a stronger password — at least 8 characters.",
    };
  }
  if (/captcha|turnstile|verification/.test(message)) {
    return {
      code: "captcha_failed",
      message: "Human-verification failed. Complete the check and try again.",
    };
  }
  if (/fetch|network|timeout|connection/.test(message)) {
    return {
      code: "network",
      message: "Network problem. Check your connection and try again.",
    };
  }
  return {
    code: "unknown",
    message: "Something went wrong. Please try again.",
  };
}

/**
 * The deliberately generic response for signup + forgot-password. Whether or
 * not the address is registered, the user sees the same thing — so the form
 * can't be used to probe which emails have accounts.
 */
export const ENUMERATION_SAFE_SIGNUP =
  "If that email can be used, we've sent a confirmation link. Check your inbox.";

export const ENUMERATION_SAFE_RESET =
  "If an account exists for that email, a reset link is on its way. Check your inbox.";

function extractMessage(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const o = raw as { message?: unknown; error?: unknown; status?: unknown };
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (o.status === 429) return "rate limit";
  }
  return "";
}
