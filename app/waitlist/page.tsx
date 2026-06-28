import Link from "next/link";

import { PageIntro } from "@/components/sections/page-intro";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { waitlistBenefits, waitlistSegments } from "@/lib/data/site-content";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

export default function WaitlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <PageIntro
            eyebrow="Buyer Waitlist"
            title="Capture early buyer intent before public launch."
            description="This waitlist page gives SKXNZ a clean private intake surface for demand validation while checkout, live inventory, and production emails remain intentionally offline."
            actions={
              <>
                <Link
                  href="/shop"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Browse Products
                </Link>
                <Link
                  href="/ai-stylist"
                  className={buttonVariants({ variant: "ghost", size: "lg" })}
                >
                  AI Stylist
                </Link>
              </>
            }
            footer={
              <div className="space-y-3">
                {waitlistBenefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver"
                  >
                    <span className="signal-dot inline-flex items-start">{benefit}</span>
                  </div>
                ))}
              </div>
            }
          />

          <Card className="section-border rounded-[32px] p-6">
          <Badge>Audience Segments</Badge>
            <div className="mt-5 flex flex-wrap gap-3">
              {waitlistSegments.map((segment) => (
                <Badge key={segment}>{segment}</Badge>
              ))}
            </div>
          </Card>
        </div>

        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <Badge>MVP Placeholder</Badge>
          <form className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                  First name
                </span>
                <input
                  type="text"
                  placeholder="Vivaan"
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="futurewear@signal.mail"
                  className={fieldClassName}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                  Interest
                </span>
                <select className={fieldClassName}>
                  <option>Private drop access</option>
                  <option>AI stylist beta</option>
                  <option>Seller updates too</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                  Region
                </span>
                <input
                  type="text"
                  placeholder="City / country"
                  className={fieldClassName}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Style note
              </span>
              <textarea
                rows={5}
                placeholder="Tell SKXNZ what silhouettes, colors, or product categories you want to see first."
                className="w-full min-w-0 max-w-full break-words rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-pearl outline-none placeholder:text-silver/60 focus:border-teal/40"
              />
            </label>

            <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-silver">
              This surface is for private MVP testing only. It does not send live
              confirmation emails or add people to a production waitlist yet.
            </div>

            <button
              type="button"
              disabled
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Waitlist Submit Disabled In MVP
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
