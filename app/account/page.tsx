import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser, getCurrentUserRoleDetail } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

// Session-dependent page — never cache.
export const dynamic = "force-dynamic";

// Real Supabase-auth account page. Logged out -> /login?next=/account.
// Shows the actual signed-in identity, DB role, and role-lookup diagnostics
// so auth/role issues are visible instead of silent.
export default async function AccountPage() {
  const user = await requireUser("/account");
  const roleLookup = await getCurrentUserRoleDetail();

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.name ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null);
  const email = profile?.email ?? user.email ?? "Unknown email";

  // Public project host only (from NEXT_PUBLIC_ env) — no keys, no secrets.
  let supabaseHost = "unknown";
  try {
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    supabaseHost = "invalid NEXT_PUBLIC_SUPABASE_URL";
  }

  const role = roleLookup.role;

  const roleNotes: Record<string, string> = {
    BUYER:
      "Buyer account. You can browse the catalogue, review your cart, create unpaid draft orders, and open support or return requests. Live payment is not connected yet.",
    SELLER:
      "Seller account. You can open the seller workspace, list your products, and submit new products for review.",
    ADMIN:
      "Admin account. You can open the admin workspace and moderate seller product submissions.",
    RIDER: "Rider account. Rider tools are not built yet.",
  };

  // Raw backend errors are logged server-side only; buyers see friendly copy.
  let roleStatus: string;
  if (role) {
    roleStatus = roleNotes[role];
  } else {
    if (roleLookup.error) {
      console.warn("[account] role lookup failed:", roleLookup.error);
    }
    roleStatus =
      "We could not load your account details right now. Your sign-in is fine — refresh this page, and contact support if this keeps happening.";
  }

  if (profileError) {
    console.warn("[account] profile lookup failed:", profileError.message);
  }

  const accountDetails: Array<[string, string]> = [
    ["Email", email],
    ["Account ID", user.id],
    ["Account type", role ? role.charAt(0) + role.slice(1).toLowerCase() : "Being verified"],
    ["Connected region", supabaseHost.endsWith(".supabase.co") ? "SKXNZ secure cloud" : supabaseHost],
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Your account
          </p>
          <h1 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
            Account signal.
          </h1>
          <p className="mt-2 text-sm text-stone">
            Signed in as <span className="font-semibold text-midnightbrown">{email}</span>
            {displayName ? ` (${displayName})` : ""}
          </p>

          <p className="mt-6 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            {roleStatus}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {(role === "SELLER" || role === "ADMIN") && (
              <Link
                href="/seller/products"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Seller Products
              </Link>
            )}
            {role === "ADMIN" && (
              <Link
                href="/admin/products"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Admin Product Review
              </Link>
            )}
            <Link
              href="/orders"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              My Orders
            </Link>
            <Link
              href="/shop"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Browse Shop
            </Link>
            <Link
              href="/account/support"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Contact Support
            </Link>
            <Link
              href="/account/returns"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              My Returns
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Sign Out
              </button>
            </form>
          </div>
        </Card>

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Account details
          </p>
          <p className="mt-2 text-sm leading-6 text-stone">
            The identity SKXNZ has for this session. No passwords, tokens, or
            payment details are ever shown here.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {accountDetails.map(([label, value]) => (
              <div
                key={label}
                className="rounded-[20px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4"
              >
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
                  {label}
                </dt>
                <dd className="mt-2 break-all text-sm font-semibold text-midnightbrown">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Coming next
          </p>
          <p className="mt-3 text-sm leading-7 text-stone">
            Live payment, delivery tracking, and refunds are not connected yet.
            Your orders, saved addresses, returns, and support tickets are
            already available from this account.
          </p>
        </Card>
      </div>
    </main>
  );
}
