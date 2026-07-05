import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const authError = params.error ?? null
  const nextPath = params.next ?? undefined

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <PageIntro
          eyebrow="SIGN IN"
          title="ENTER THE SIGNAL."
          description="Sign in to your SKXNZ account and continue into the futurewear marketplace."
          actions={
            <>
              <Link
                href="/shop"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Browse Shop
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Create Account
              </Link>
              <Link
                href="/about"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                About SKXNZ
              </Link>
            </>
          }
        />

        {authError && (
          <div className="rounded-[20px] border border-sangria/30 bg-sangria/10 px-5 py-4 text-sm leading-6 text-midnightbrown">
            <span className="font-semibold">Sign-in error:&nbsp;</span>
            {authError}
          </div>
        )}

        <div className="max-w-xl">
          <AuthCard mode="login" nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}
