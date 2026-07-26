// Next.js glue: request identity extraction and HTTP response shaping.
// SERVER ONLY — reads request headers.
import { headers } from "next/headers";

import type { RateLimitResult } from "./types";

/**
 * Extract the caller IP.
 *
 * SECURITY NOTE: every header here is client-settable at the origin. They are
 * only trustworthy because Vercel overwrites `x-forwarded-for` at its edge. On
 * any host that does NOT overwrite it, an attacker rotates the header and
 * bypasses every ip-scoped limit. `x-vercel-forwarded-for` is preferred first
 * because the platform sets it and it is not client-spoofable there.
 *
 * The left-most entry of `x-forwarded-for` is the original client; later
 * entries are proxies.
 */
export function extractIpFromHeaders(headerList: Headers): string | null {
  const vercel = headerList.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }

  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerList.get("x-real-ip")?.trim() || null;
}

/** IP for a Route Handler, which receives the Request directly. */
export function getRequestIp(request: Request): string | null {
  return extractIpFromHeaders(request.headers);
}

/** IP inside a Server Action, where there is no Request object. */
export async function getServerActionIp(): Promise<string | null> {
  try {
    const headerList = await headers();
    return extractIpFromHeaders(headerList);
  } catch {
    // headers() throws outside a request scope (e.g. during a build probe).
    // Returning null degrades to "no ip", which the limiter reports as degraded
    // rather than silently pretending the request was checked.
    return null;
  }
}

/** Standard rate-limit headers so clients can back off correctly. */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headerBag: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))),
  };
  if (!result.allowed) {
    headerBag["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headerBag;
}

/**
 * 429 for Route Handlers. Truthful body: states the limit was hit and when to
 * retry. No fake success, no silent empty result.
 */
export function createRateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      code: "RATE_LIMITED",
      message: `Too many requests. Try again in ${result.retryAfterSeconds} second${
        result.retryAfterSeconds === 1 ? "" : "s"
      }.`,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...buildRateLimitHeaders(result),
      },
    },
  );
}
