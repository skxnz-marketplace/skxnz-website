// Cookie-consent model: categories, versioning, strict parsing, first-party
// cookie IO. Framework-agnostic and dependency-free so it unit-tests directly
// and runs on both server (read the cookie in a Server Component) and client.
//
// Storage choice: a first-party cookie (not localStorage), because the server
// must be able to read the decision to gate server-rendered script tags and to
// know whether to show the banner without a flash. The cookie is NOT HttpOnly —
// the client reads it to gate client-side scripts and render the banner.

export const CONSENT_COOKIE = "skxnz_consent";
// Bump when the category set or their meaning changes — an older version in a
// stored record forces the banner to reappear so the user re-decides.
export const CONSENT_VERSION = 1;
// ~13 months, the common ceiling for consent records.
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export type ConsentCategory = "necessary" | "preferences" | "analytics" | "marketing";

export const OPTIONAL_CATEGORIES: readonly ConsentCategory[] = [
  "preferences",
  "analytics",
  "marketing",
];

export type ConsentCategories = Record<ConsentCategory, boolean>;

export type ConsentRecord = {
  version: number;
  /** ISO 8601 UTC timestamp of the decision. */
  timestamp: string;
  categories: ConsentCategories;
};

/** Necessary is always on; every optional category defaults OFF. */
export function defaultCategories(): ConsentCategories {
  return { necessary: true, preferences: false, analytics: false, marketing: false };
}

/** "Accept all" — necessary + every optional on. */
export function allOnCategories(): ConsentCategories {
  return { necessary: true, preferences: true, analytics: true, marketing: true };
}

/** "Reject non-essential" — only necessary on. */
export function rejectOptionalCategories(): ConsentCategories {
  return defaultCategories();
}

/**
 * Build a fresh record. `necessary` is forced true regardless of input — it is
 * never a real choice, and accepting a stored `necessary:false` would be a bug.
 */
export function buildConsentRecord(
  categories: Partial<ConsentCategories>,
  nowIso: string,
): ConsentRecord {
  return {
    version: CONSENT_VERSION,
    timestamp: nowIso,
    categories: {
      necessary: true,
      preferences: categories.preferences === true,
      analytics: categories.analytics === true,
      marketing: categories.marketing === true,
    },
  };
}

/**
 * Strictly parse a stored consent string. Returns null on anything malformed,
 * corrupted, wrong-shaped, or from an older consent version — the caller then
 * treats the user as undecided and shows the banner. Fails safe: a bad record
 * never resolves to "analytics on".
 */
export function parseConsent(raw: string | null | undefined): ConsentRecord | null {
  if (!raw || typeof raw !== "string") return null;

  let obj: unknown;
  try {
    obj = JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;

  const o = obj as Record<string, unknown>;
  if (typeof o.version !== "number" || o.version !== CONSENT_VERSION) return null;
  if (typeof o.timestamp !== "string" || !isIsoDate(o.timestamp)) return null;

  const cats = o.categories;
  if (!cats || typeof cats !== "object") return null;
  const c = cats as Record<string, unknown>;

  for (const key of ["necessary", "preferences", "analytics", "marketing"] as const) {
    if (typeof c[key] !== "boolean") return null;
  }

  return {
    version: CONSENT_VERSION,
    timestamp: o.timestamp,
    categories: {
      necessary: true, // always on, never trust a stored false
      preferences: c.preferences === true,
      analytics: c.analytics === true,
      marketing: c.marketing === true,
    },
  };
}

/** Has the user made a valid, current-version decision? */
export function hasValidConsent(raw: string | null | undefined): boolean {
  return parseConsent(raw) !== null;
}

/** Is a specific category currently granted? Undecided ⇒ only necessary. */
export function isCategoryGranted(
  raw: string | null | undefined,
  category: ConsentCategory,
): boolean {
  if (category === "necessary") return true;
  const rec = parseConsent(raw);
  return rec ? rec.categories[category] === true : false;
}

/** Serialize for the cookie value (URL-encoded JSON). */
export function serializeConsent(record: ConsentRecord): string {
  return encodeURIComponent(JSON.stringify(record));
}

/** Cookie attributes for document.cookie / Set-Cookie. Not HttpOnly by design. */
export function consentCookieAttributes(secure: boolean): string {
  const parts = [
    `Path=/`,
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return false;
  const t = Date.parse(value);
  return Number.isFinite(t);
}
