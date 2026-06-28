import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { DemoLoginPanel } from "@/components/auth/demo-login-panel";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <PageIntro
          eyebrow="Demo Login"
          title="Choose a safe MVP role before you enter the next SKXNZ surface."
          description="This route is a simple role switcher for internal testing. It changes navigation and access states locally only, with no real authentication provider, no database writes, and no live permissions."
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
                Signup Placeholder
              </Link>
              <Link
                href="/about"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                About SKXNZ
              </Link>
            </>
          }
          footer={
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                "Buyer mode is best for testing browse, wishlist, cart, and account placeholders.",
                "Seller mode opens the private dashboard, seeded products, and order review surfaces.",
                "Admin mode exposes moderation queues and support tables without turning on live operations.",
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_0.8fr]">
          <DemoLoginPanel />
          <AuthCard mode="login" />
        </div>
      </div>
    </div>
  );
}
