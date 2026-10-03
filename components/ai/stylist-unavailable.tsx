import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export function StylistUnavailable() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <p className="text-[0.8rem] uppercase tracking-[0.24em] text-teal">AI Stylist</p>
        <h1 className="mt-4 break-words font-display text-3xl uppercase text-midnightbrown">
          The styling workspace is unavailable.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-midnightbrown/72">
          Outfit generation and guest previews are not enabled for this release.
          You can browse the SKXNZ catalogue.
        </p>
        <Link href="/shop" className={buttonVariants({ variant: "secondary", size: "lg", className: "mt-6" })}>
          Browse the Catalogue
        </Link>
      </Card>
    </div>
  );
}
