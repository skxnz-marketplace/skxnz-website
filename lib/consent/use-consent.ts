"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONSENT_COOKIE,
  buildConsentRecord,
  consentCookieAttributes,
  parseConsent,
  serializeConsent,
  type ConsentCategories,
  type ConsentRecord,
} from "./consent";

// Client hook over the first-party consent cookie. Single source the banner,
// preference centre, and any gated script read from. Cross-component updates
// are broadcast with a window event so every mounted reader re-reads at once.

const CONSENT_EVENT = "skxnz:consent-changed";

function readCookie(): ConsentRecord | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  return parseConsent(match.slice(CONSENT_COOKIE.length + 1));
}

function writeCookie(record: ConsentRecord) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(record)}; ${consentCookieAttributes(secure)}`;
}

export type UseConsent = {
  /** null until mounted (avoids SSR/CSR mismatch); then record or null. */
  record: ConsentRecord | null;
  /** True once we've read the cookie on the client. */
  ready: boolean;
  /** Has a valid, current-version decision been stored? */
  decided: boolean;
  /** Persist a decision. `nowIso` is injected so it's deterministic in tests. */
  save: (categories: Partial<ConsentCategories>) => void;
  /** Clear the decision entirely — the banner returns (withdrawal). */
  withdraw: () => void;
};

export function useConsent(): UseConsent {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setRecord(readCookie());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(CONSENT_EVENT, onChange);
    // Another tab may change consent; storage event won't fire for cookies, so
    // we also re-read on focus.
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh]);

  const save = useCallback((categories: Partial<ConsentCategories>) => {
    const rec = buildConsentRecord(categories, new Date().toISOString());
    writeCookie(rec);
    setRecord(rec);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }, []);

  const withdraw = useCallback(() => {
    if (typeof document !== "undefined") {
      const secure = window.location.protocol === "https:";
      // Expire the cookie.
      document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
    }
    setRecord(null);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }, []);

  return { record, ready, decided: record !== null, save, withdraw };
}

export { CONSENT_EVENT };
