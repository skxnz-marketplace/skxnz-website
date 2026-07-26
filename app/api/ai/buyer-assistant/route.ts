import { NextResponse } from "next/server";

import { handleBuyerAssistantRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { BuyerAssistantRequest } from "@/src/lib/ai/types";
import { guardRouteHandler } from "@/lib/security/rate-limit/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Abuse control: policy 'ai.request'. Returns a truthful 429 with Retry-After.
  const rateLimit = await guardRouteHandler("ai.request", request);
  if (!rateLimit.ok) return rateLimit.response;

  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "buyer-assistant")) {
    return createForbiddenAiResponse("buyer-assistant");
  }

  const payload = (await request.json()) as BuyerAssistantRequest;

  if (!payload.question?.trim()) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Question is required.",
      },
      { status: 400 },
    );
  }

  const response = await handleBuyerAssistantRequest(payload, role);

  return NextResponse.json(response);
}
