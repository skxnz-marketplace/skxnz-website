import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <Card className="section-border rounded-[36px] p-8 text-center sm:p-12">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">404</p>
        <h1 className="mt-4 font-display text-3xl uppercase tracking-[0.16em] text-pearl sm:text-5xl">
          Signal not found.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-silver sm:text-base">
          The route exists outside the current drop. Head back to the homepage or continue through the shop preview.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Go Home
          </Link>
          <Link
            href="/shop"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Open Shop
          </Link>
        </div>
      </Card>
    </div>
  );
}
