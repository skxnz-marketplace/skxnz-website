// Open-redirect protection for the auth `next` / return-to parameter.
//
// The only safe destination is a same-origin, root-relative path. Everything
// else — absolute URLs, protocol-relative "//host", backslash tricks that some
// browsers fold into "//", javascript: and data: schemes, or anything that
// doesn't begin with a single "/" — collapses to "/". This is the single
// source of truth; every auth surface routes its redirect through it.

const DEFAULT_PATH = "/";

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return DEFAULT_PATH;

  const value = raw.trim();
  if (value.length === 0 || value.length > 2048) return DEFAULT_PATH;

  // Must be root-relative and not protocol-relative "//host".
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_PATH;

  // Backslashes: browsers can normalize "/\evil.com" or "\\evil.com" to "//".
  if (value.includes("\\")) return DEFAULT_PATH;

  // Control chars (incl. embedded newlines / tabs) never belong in a path.
  if (/[\x00-\x1f\x7f]/.test(value)) return DEFAULT_PATH;

  // A scheme before the first slash (e.g. "/x:http://..") can't appear because
  // we already require a leading "/", but guard obvious scheme injection.
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return DEFAULT_PATH;

  return value;
}

/** Build an absolute redirect URL from a trusted origin + an untrusted next. */
export function safeRedirectUrl(origin: string, rawNext: string | null | undefined): string {
  return `${origin}${safeNextPath(rawNext)}`;
}
