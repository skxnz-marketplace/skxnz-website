"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Route-level error boundary. Without this, an uncaught render error in any
// route segment falls through to Next's built-in production error screen,
// which is unbranded and offers the buyer no way back.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs get the real error; the browser only ever sees the digest.
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <Card className="section-border rounded-[36px] p-8 text-center sm:p-12">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Something broke
        </p>
        <h1 className="mt-4 font-display text-3xl uppercase tracking-[0.16em] text-pearl sm:text-5xl">
          Signal interrupted.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-silver sm:text-base">
          This page failed to load. Nothing you were doing was charged or
          submitted. Try again, or head back to the catalogue.
        </p>
        {error.digest ? (
          <p className="mx-auto mt-4 text-[0.68rem] uppercase tracking-[0.18em] text-silver">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Try Again
          </button>
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
