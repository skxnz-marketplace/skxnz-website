// Consent gating helpers. GoogleAnalytics uses the same validated consent
// record via useConsent. This registry does not load scripts itself.
//
// Usage when an analytics/marketing tool is later added:
//   if (canRun(consentCookieValue, "analytics")) initAnalytics()
// and re-check on the `skxnz:consent-changed` event so withdrawal stops it.

import { isCategoryGranted, type ConsentCategory } from "./consent";

/**
 * May an optional integration in `category` run, given the raw consent cookie?
 * `necessary` is always allowed. Anything optional requires an explicit stored
 * grant — undecided, corrupt, or old-version records all deny (fail safe).
 */
export function canRun(
  rawConsentCookie: string | null | undefined,
  category: ConsentCategory,
): boolean {
  return isCategoryGranted(rawConsentCookie, category);
}

/**
 * Registry of optional integrations, for documentation + a future gated loader.
 * Entries do not auto-load anything; each loader must enforce consent.
 */
export const OPTIONAL_INTEGRATIONS: ReadonlyArray<{
  id: string;
  category: Exclude<ConsentCategory, "necessary">;
  installed: boolean;
}> = [{ id: "google-analytics", category: "analytics", installed: true }];

/** True only if at least one optional integration is actually installed. */
export function hasInstalledOptionalIntegrations(): boolean {
  return OPTIONAL_INTEGRATIONS.some((i) => i.installed);
}
