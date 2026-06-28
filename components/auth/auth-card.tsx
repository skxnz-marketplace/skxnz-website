import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const isSignup = mode === "signup";

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        {isSignup ? "Signup placeholder" : "Login placeholder"}
      </p>
      <h2 className="mt-4 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        {isSignup ? "Account creation is coming later." : "Demo login only."}
      </h2>
      <p className="mt-4 text-sm leading-7 text-stone">
        SKXNZ does not have live authentication connected yet. Do not enter real
        passwords or private customer data here. Use the demo login to preview
        buyer, seller, and admin areas safely.
      </p>
      <div className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
        Account system beta. Persistent account sync coming later.
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Open Demo Login
        </Link>
        <Link
          href="/account"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Account Foundation
        </Link>
        <Link
          href="/shop"
          className={buttonVariants({ variant: "ghost", size: "lg" })}
        >
          Browse Shop
        </Link>
      </div>
    </Card>
  );
}
