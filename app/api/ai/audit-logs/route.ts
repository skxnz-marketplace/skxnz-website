import { NextResponse } from "next/server";

import { listAiAuditLogs } from "@/src/lib/ai/runtime-store";
import { getDemoRoleFromHeaders } from "@/src/lib/ai/safety";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const role = getDemoRoleFromHeaders(request.headers);

  if (role !== "admin") {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "AI audit logs are restricted to admin demo access.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    totalEvents: listAiAuditLogs().length,
    logs: listAiAuditLogs(),
  });
}
