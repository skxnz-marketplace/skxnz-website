import { NextResponse } from "next/server";

import { aiModules } from "@/src/data/aiOperatingSystem";
import { getAiProviderConfig } from "@/src/lib/ai/provider";
import { listAiUsageLogs } from "@/src/lib/ai/runtime-store";
import { getDemoRoleFromHeaders } from "@/src/lib/ai/safety";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const role = getDemoRoleFromHeaders(request.headers);

  if (role !== "admin") {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "AI usage logs are restricted to admin demo access.",
      },
      { status: 403 },
    );
  }

  const logs = listAiUsageLogs();

  return NextResponse.json({
    provider: getAiProviderConfig(),
    features: aiModules
      .filter((module) => module.launchPhase === "Phase 1")
      .map((module) => module.feature),
    totalRequests: logs.length,
    totalEstimatedCost: logs.reduce((sum, entry) => sum + entry.costEstimate, 0),
    logs,
  });
}
