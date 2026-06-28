"use client";

import { useDemoRole } from "@/components/auth/demo-role-provider";

export function MockNotice() {
  const { role, isHydrated } = useDemoRole();
  const activeRole = isHydrated ? role : null;

  if (activeRole !== "seller" && activeRole !== "admin") {
    return null;
  }

  return (
    <div className="border-b border-white/[0.08] bg-white/[0.03]">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-[0.65rem] uppercase tracking-[0.24em] text-silver sm:px-6 lg:px-8">
        Private web MVP placeholder only. Payments, delivery, approvals, and AI flows
        shown here are for internal testing.
      </div>
    </div>
  );
}
