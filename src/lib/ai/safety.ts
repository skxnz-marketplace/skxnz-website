import { NextResponse } from "next/server";

import type { AiFeatureKey } from "@/src/lib/ai/types";

export type DemoRequestRole = "buyer" | "seller" | "admin" | null;

const featurePermissions: Record<AiFeatureKey, DemoRequestRole[]> = {
  "buyer-assistant": ["buyer", "seller", "admin"],
  "outfit-builder": ["buyer", "seller", "admin"],
  "seller-product-check": ["seller", "admin"],
  "try-on": ["buyer", "admin"],
};

export function getDemoRoleFromHeaders(headers: Headers): DemoRequestRole {
  const rawRole = headers.get("x-skxnz-demo-role")?.trim().toLowerCase() ?? null;

  if (rawRole === "buyer" || rawRole === "seller" || rawRole === "admin") {
    return rawRole;
  }

  return null;
}

export function assertAiFeatureAccess(role: DemoRequestRole, feature: AiFeatureKey) {
  return featurePermissions[feature].includes(role);
}

export function createForbiddenAiResponse(feature: AiFeatureKey) {
  return NextResponse.json(
    {
      error: "forbidden",
      feature,
      message:
        "This AI route is available only inside the SKXNZ private MVP role system.",
    },
    { status: 403 },
  );
}

export function getAiDisclaimerCopy() {
  return "AI guidance uses structured SKXNZ catalogue data only. It does not guarantee fit, visual accuracy, delivery timing, or brand partnership status unless explicitly verified.";
}

export function getTryOnConsentCopy() {
  return "Future try-on is not live yet. User photos must never be stored or processed without explicit consent, clear retention policy, and a delete path.";
}
