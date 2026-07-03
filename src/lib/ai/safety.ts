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
  // SECURITY: the x-skxnz-demo-role header is client-controlled and therefore
  // spoofable. It is honored ONLY in non-production (local/preview demo) so a
  // request cannot self-assign a role in production. Real role authorization
  // must come from the Supabase session (public.users.role) — see
  // lib/auth/roles.ts. In production this always returns null.
  if (process.env.NODE_ENV === "production") {
    return null;
  }

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
