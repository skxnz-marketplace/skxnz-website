// PUBLIC API of the SKXNZ rate-limit framework.
//
// Call sites import from here and from nowhere deeper. They name a policy and
// pass an identity; they never see a limit number, a window, or a store.
//
// Server Action:
//   const limit = await guardServerAction("support.ticket", { userId: user.id });
//   if (!limit.ok) return limit.error;          // { ok:false, code:"RATE_LIMITED", message }
//
// Route Handler:
//   const limit = await guardRouteHandler("ai.request", request, { userId });
//   if (!limit.ok) return limit.response;       // 429 + Retry-After
import { consumeRateLimit, type ConsumeOptions } from "./limiter";
import { getRequestIp, getServerActionIp, createRateLimitedResponse, buildRateLimitHeaders } from "./helpers";
import type { RateLimitPolicyName } from "./policies";
import type { RateLimitResult, RateLimitSubject } from "./types";

/** Error shape matching the existing SKXNZ server-action contract. */
export type RateLimitedError = {
  ok: false;
  code: "RATE_LIMITED";
  message: string;
};

export type ServerActionGuard =
  | { ok: true; result: RateLimitResult }
  | { ok: false; result: RateLimitResult; error: RateLimitedError };

export type RouteHandlerGuard =
  | { ok: true; result: RateLimitResult }
  | { ok: false; result: RateLimitResult; response: Response };

function buildMessage(result: RateLimitResult): string {
  return `Too many requests. Try again in ${result.retryAfterSeconds} second${
    result.retryAfterSeconds === 1 ? "" : "s"
  }.`;
}

/**
 * Guard a Server Action.
 *
 * `subject.userId` MUST come from the verified session, never from client input
 * — otherwise a caller rotates the id and evades the limit entirely. The IP is
 * read from request headers automatically.
 */
export async function guardServerAction(
  policyName: RateLimitPolicyName,
  subject: Omit<RateLimitSubject, "ip"> & { ip?: string | null },
  options: ConsumeOptions = {},
): Promise<ServerActionGuard> {
  const ip = subject.ip ?? (await getServerActionIp());
  const result = await consumeRateLimit(policyName, { ...subject, ip }, options);

  if (result.allowed) {
    return { ok: true, result };
  }

  return {
    ok: false,
    result,
    error: { ok: false, code: "RATE_LIMITED", message: buildMessage(result) },
  };
}

/** Guard a Route Handler. Returns a ready 429 with Retry-After when blocked. */
export async function guardRouteHandler(
  policyName: RateLimitPolicyName,
  request: Request,
  subject: Omit<RateLimitSubject, "ip"> = {},
  options: ConsumeOptions = {},
): Promise<RouteHandlerGuard> {
  const result = await consumeRateLimit(
    policyName,
    { ...subject, ip: getRequestIp(request) },
    options,
  );

  if (result.allowed) {
    return { ok: true, result };
  }

  return { ok: false, result, response: createRateLimitedResponse(result) };
}

export { consumeRateLimit } from "./limiter";
export { getRateLimiterCapability, getRateLimitStore, resetRateLimitStore } from "./adapters";
export { RATE_LIMIT_POLICIES, listPolicies, getPolicy } from "./policies";
export { buildRateLimitKey, subjectSatisfiesScope } from "./keys";
export { createRateLimitedResponse, buildRateLimitHeaders, getRequestIp, getServerActionIp };
export type { RateLimitPolicyName } from "./policies";
export type {
  RateLimitPolicy,
  RateLimitResult,
  RateLimitSubject,
  RateLimitStore,
  RateLimiterCapability,
} from "./types";
