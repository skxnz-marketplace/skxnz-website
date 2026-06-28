import { NextResponse } from "next/server";

import { handleSellerProductCheckRequest } from "@/src/lib/ai/service";
import {
  assertAiFeatureAccess,
  createForbiddenAiResponse,
  getDemoRoleFromHeaders,
} from "@/src/lib/ai/safety";
import type { SellerProductCheckRequest } from "@/src/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const role = getDemoRoleFromHeaders(request.headers);

  if (!assertAiFeatureAccess(role, "seller-product-check")) {
    return createForbiddenAiResponse("seller-product-check");
  }

  const payload = (await request.json()) as SellerProductCheckRequest;
  const response = await handleSellerProductCheckRequest(payload, role);

  return NextResponse.json(response);
}
