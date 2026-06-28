import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <PageIntro
          eyebrow="Signup Beta"
          title="Account creation is planned, not live."
          description="This page prepares the SKXNZ account foundation safely. Real signup, password handling, email verification, and persistent account sync are not connected yet."
          actions={
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Open Demo Login
              </Link>
              <Link
                href="/shop"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Browse Shop
              </Link>
            </>
          }
        />
        <AuthCard mode="signup" />
      </div>
    </div>
  );
}
