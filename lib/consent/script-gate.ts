// Consent gating — the single decision point a future optional integration
// must pass through before it initializes. There are currently NO analytics or
// marketing scripts installed, so nothing is gated in practice yet; this is the
// truthful extension point, not a live tracker. It never makes a network
// request, sets a pixel, or loads a third-party script on its own.
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
 * Empty on purpose: SKXNZ ships no analytics/marketing scripts today. Adding an
 * entry here does NOT auto-load anything — a loader must still call canRun().
 */
export const OPTIONAL_INTEGRATIONS: ReadonlyArray<{
  id: string;
  category: Exclude<ConsentCategory, "necessary">;
  installed: boolean;
}> = [];

/** True only if at least one optional integration is actually installed. */
export function hasInstalledOptionalIntegrations(): boolean {
  return OPTIONAL_INTEGRATIONS.some((i) => i.installed);
}
