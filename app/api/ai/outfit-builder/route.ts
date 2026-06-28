import { NextResponse } from "next/server";

import { handleOutfitBuilderRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { OutfitBuilderRequest } from "@/src/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
