import Link from "next/link";

import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

export default function SellerLoginPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PageIntro
          eyebrow="Seller Login"
          title="Authentication stays placeholder-only in the first MVP."
          description="This route is included so the seller workflow feels complete, but real authentication, sessions, and role checks should be added only after the private foundation is approved."
          actions={
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Open Demo Login
              </Link>
              <Link
                href="/sell"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Back to Apply
              </Link>
            </>
          }
          footer={
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                "Add your preferred auth provider later.",
                "Keep seller access private until moderation rules are ready.",
                "Map roles before turning on real product editing.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver"
                >
                  {item}
                </div>
              ))}
            </div>
          }
        />

        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <form className="space-y-4">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Email
              </span>
              <input
                type="email"
                placeholder="seller@skxnz.local"
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Password
              </span>
              <input
                type="password"
                placeholder="Placeholder password"
                className={fieldClassName}
              />
            </label>
            <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-silver break-words">
              Demo access only — real authentication is not connected yet. Use
              the shared demo login route to enter seller mode for MVP testing.
            </div>
            <button
              type="button"
              disabled
              className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full sm:w-auto`}
            >
              Seller Login Disabled In MVP
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
