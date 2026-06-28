"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { type DemoRole, demoRoleSummaries } from "@/lib/demo-role";

type DemoRoleGateProps = {
  allowedRoles: DemoRole[];
  areaLabel: string;
  helperText: string;
  children: ReactNode;
};

export function DemoRoleGate({
  allowedRoles,
  areaLabel,
  helperText,
  children,
}: DemoRoleGateProps) {
  const { role, isHydrated, setRole, clearRole } = useDemoRole();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] p-8 text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Demo Access
          </p>
          <h1 className="mt-4 break-words font-display text-[1.7rem] uppercase tracking-[0.08em] text-midnightbrown sm:text-3xl sm:tracking-[0.14em]">
            Checking saved demo role.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-midnightbrown/72">
            The SKXNZ MVP is loading the locally saved role so the correct workspace
            can be shown safely.
          </p>
        </Card>
      </div>
    );
  }

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  const allowedRoleLabels = allowedRoles
    .map((allowedRole) => demoRoleSummaries[allowedRole].label)
    .join(" or ");

  const currentRoleLabel = role ? demoRoleSummaries[role].label : "No role selected";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Demo Access Required
        </p>
        <h1 className="mt-4 break-words font-display text-[1.8rem] uppercase leading-[0.98] tracking-[0.08em] text-midnightbrown sm:text-3xl sm:tracking-[0.14em]">
          {areaLabel} is available only in {allowedRoleLabels} demo mode.
        </h1>
        <p className="mt-4 text-sm leading-7 text-midnightbrown/72">
          You are currently in {currentRoleLabel}. Switch roles below to preview this
          protected MVP area without turning on real authentication or database writes.
        </p>
        <p className="mt-4 rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-midnightbrown/78">
          Demo access only — real authentication is not connected yet.
        </p>
        <p className="mt-4 text-sm leading-7 text-midnightbrown/72">{helperText}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {allowedRoles.map((allowedRole) => (
            <Button
              key={allowedRole}
              type="button"
              size="lg"
              onClick={() => setRole(allowedRole)}
            >
              Continue as {demoRoleSummaries[allowedRole].label}
            </Button>
          ))}
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Open Demo Login
          </Link>
          {role ? (
            <Button type="button" variant="ghost" size="lg" onClick={clearRole}>
              Exit Current Demo
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
