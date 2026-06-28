import { NextResponse } from "next/server";

import { handleBuyerAssistantRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { BuyerAssistantRequest } from "@/src/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
