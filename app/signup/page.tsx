import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <PageIntro
          eyebrow="JOIN SKXNZ"
          title="ENTER THE SIGNAL."
          description="Create your SKXNZ account to access the futurewear marketplace."
          actions={
            <>
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
