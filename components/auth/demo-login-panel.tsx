"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import {
  demoRoleSummaries,
  getDemoNavLinks,
  type DemoRole,
} from "@/lib/demo-role";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const roleOrder: DemoRole[] = ["buyer", "seller", "admin"];

export function DemoLoginPanel() {
  const router = useRouter();
  const { role, setRole, clearRole } = useDemoRole();

  function handleRoleSelect(nextRole: DemoRole) {
    setRole(nextRole);
    router.push(demoRoleSummaries[nextRole].defaultHref);
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[32px] border-sangria/20 bg-sangria/10 p-5 text-sm leading-6 text-silver">
        Demo access only — real authentication is not connected yet.
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {roleOrder.map((demoRole) => {
          const roleSummary = demoRoleSummaries[demoRole];

          return (
            <Card key={demoRole} className="section-border rounded-[32px] p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
                {roleSummary.label} Demo
              </p>
              <h2 className="mt-4 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
                Continue as {roleSummary.label}
              </h2>
              <p className="mt-4 text-sm leading-7 text-silver">
                {roleSummary.description}
              </p>
              <div className="mt-5 space-y-3">
                {getDemoNavLinks(demoRole).map((item) => (
                  <div
                    key={`${demoRole}-${item.href}`}
                    className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button type="button" size="lg" onClick={() => handleRoleSelect(demoRole)}>
                  Continue as {roleSummary.label}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {role ? (
        <Card className="section-border rounded-[32px] p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Current Demo Role
          </p>
          <h2 className="mt-4 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            {demoRoleSummaries[role].label} mode is active.
          </h2>
          <p className="mt-4 text-sm leading-7 text-silver">
            You can switch roles at any time to test the buyer, seller, and admin
            navigation states without connecting a live authentication provider.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="ghost" size="lg" onClick={clearRole}>
              Exit Current Demo
            </Button>
            <Link
              href={demoRoleSummaries[role].defaultHref}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Open {demoRoleSummaries[role].label} Workspace
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
