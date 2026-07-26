import { NextResponse } from "next/server";

import { handleOutfitBuilderRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { OutfitBuilderRequest } from "@/src/lib/ai/types";
import { guardRouteHandler } from "@/lib/security/rate-limit/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Abuse control: policy 'ai.request'. Returns a truthful 429 with Retry-After.
  const rateLimit = await guardRouteHandler("ai.request", request);
  if (!rateLimit.ok) return rateLimit.response;

  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "outfit-builder")) {
    return createForbiddenAiResponse("outfit-builder");
  }

  const payload = (await request.json()) as OutfitBuilderRequest;

  if (!payload.budget || payload.budget <= 0) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "A positive outfit budget is required.",
      },
      { status: 400 },
    );
  }

  const response = await handleOutfitBuilderRequest(payload, role);

  return NextResponse.json(response);
}
