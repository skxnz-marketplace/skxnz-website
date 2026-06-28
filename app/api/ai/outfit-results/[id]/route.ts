import { NextResponse } from "next/server";

import { getStoredOutfitResult } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "outfit-builder")) {
    return createForbiddenAiResponse("outfit-builder");
  }

  const { id } = await params;
  const result = getStoredOutfitResult(id);

  if (!result) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "No outfit result exists for that request id in the current MVP session.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
