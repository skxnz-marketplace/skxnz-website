import { NextResponse } from "next/server";

import { getStoredTryOnJob } from "@/src/lib/ai/service";
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

  if (!assertAiFeatureAccess(role, "try-on")) {
    return createForbiddenAiResponse("try-on");
  }

  const { id } = await params;
  const job = getStoredTryOnJob(id);

  if (!job) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "No future try-on job exists for that id in the current MVP session.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(job);
}
