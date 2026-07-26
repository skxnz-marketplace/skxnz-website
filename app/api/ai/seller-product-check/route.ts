import { NextResponse } from "next/server";

import { handleSellerProductCheckRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { SellerProductCheckRequest } from "@/src/lib/ai/types";
import { guardRouteHandler } from "@/lib/security/rate-limit/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Abuse control: policy 'ai.request'. Returns a truthful 429 with Retry-After.
  const rateLimit = await guardRouteHandler("ai.request", request);
  if (!rateLimit.ok) return rateLimit.response;

  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "seller-product-check")) {
    return createForbiddenAiResponse("seller-product-check");
  }

  const payload = (await request.json()) as SellerProductCheckRequest;
  const response = await handleSellerProductCheckRequest(payload, role);

  return NextResponse.json(response);
}
