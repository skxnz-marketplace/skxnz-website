"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

type StylistAccessGateProps = {
  children: ReactNode;
};

/**
 * Buyer-facing access gate for the AI Stylist. Unlike the internal role gate,
 * this never surfaces internal role names or switching controls — a visitor
 * sees a truthful early-access panel with a guest preview and sign-in path.
 */
export function StylistAccessGate({ children }: StylistAccessGateProps) {
  const { role, isHydrated, setRole, user } = useDemoRole();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] p-8 text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            AI Stylist
          </p>
          <h1 className="mt-4 break-words font-display text-[1.7rem] uppercase tracking-[0.08em] text-midnightbrown sm:text-3xl sm:tracking-[0.14em]">
            Preparing the styling workspace.
          </h1>
        </Card>
      </div>
    );
  }

  if (user || role) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Early Access Preview
        </p>
        <h1 className="mt-4 break-words font-display text-[1.8rem] uppercase leading-[0.98] tracking-[0.08em] text-midnightbrown sm:text-3xl sm:tracking-[0.14em]">
          The AI Stylist is in early access.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-midnightbrown/72">
          Explore catalogue-aware styling guidance while SKXNZ prepares for
          public launch. No visual try-on or product invention is live — the
          stylist works only with real SKXNZ catalogue pieces.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" size="lg" onClick={() => setRole("buyer")}>
            Enter Guest Preview
          </Button>
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Sign In
          </Link>
          <Link
            href="/shop"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Browse the Catalogue
          </Link>
        </div>
      </Card>
    </div>
  );
}
