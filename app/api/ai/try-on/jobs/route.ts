import { NextResponse } from "next/server";

import { createTryOnJob } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
  getTryOnConsentCopy,
} from "@/src/lib/ai/safety";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "try-on")) {
    return createForbiddenAiResponse("try-on");
  }

  const job = await createTryOnJob(role);

  return NextResponse.json({
    ...job,
    uploadEnabled: false,
    message:
      "Try-on remains a future stub in Phase 1. No personal photo upload or storage is active yet.",
    consentNotice: getTryOnConsentCopy(),
  });
}
