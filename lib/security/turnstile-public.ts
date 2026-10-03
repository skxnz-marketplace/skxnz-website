// Browser-safe configuration only. Supabase auth owns CAPTCHA verification.
const TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_CONFIGURATION_ERROR =
  "Human verification is unavailable. Sign-in and account creation are temporarily disabled. Please try again later.";

export function isLocalTurnstileContext(): boolean {
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

export function isDummyTurnstileKey(key: string): boolean {
  return /^(?:1x|2x|3x)0+/.test(key);
}

export function turnstileSiteKey(): string {
  const key = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim();
  if (!key) return isLocalTurnstileContext() ? TEST_SITE_KEY : "";
  return !isLocalTurnstileContext() && isDummyTurnstileKey(key) ? "" : key;
}

export function isTurnstileTestMode(): boolean {
  return isLocalTurnstileContext() && isDummyTurnstileKey(turnstileSiteKey());
}

/** Forward once to Supabase; never perform competing Siteverify on auth tokens. */
export function captchaOptions(token: string | null | undefined): { captchaToken?: string } {
  return token ? { captchaToken: token } : {};
}
