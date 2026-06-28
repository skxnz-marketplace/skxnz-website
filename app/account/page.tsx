"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountShell } from "@/components/account/account-shell";
import { OrderHistoryDemo } from "@/components/account/order-history-demo";
import { StylePreferences } from "@/components/account/style-preferences";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDemoAddresses } from "@/lib/data/addresses";
import { demoBuyerName } from "@/lib/data/orders";

export default function AccountPage() {
  const { cartItems, wishlistProducts, supportTickets, buyerOrders, returnRequests } =
    useMarketplace();
  const [addressCount, setAddressCount] = useState(0);
  const buyerSupportCount = supportTickets.filter(
    (ticket) => ticket.userType === "Buyer",
  ).length;
  const buyerReturnCount = returnRequests.filter(
    (request) => request.buyerName === demoBuyerName,
  ).length;
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setAddressCount(getDemoAddresses().length);
  }, []);

  const stats = [
    ["Wishlist", wishlistProducts.length.toString(), "/account/wishlist"],
    ["Cart", cartCount.toString(), "/cart"],
    ["Addresses", addressCount.toString(), "/account/addresses"],
    ["Orders", buyerOrders.length.toString(), "/account/orders"],
    ["Returns", buyerReturnCount.toString(), "/returns"],
    ["Support", buyerSupportCount.toString(), "/support"],
  ];

  return (
    <AccountShell
      title="Buyer signal hub."
      description="A premium account foundation for profile, wishlist, cart, and demo order visibility before real authentication and persistent account sync are connected."
      aside={<StylePreferences />}
    >
      <div className="space-y-6">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Demo buyer account
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
            Profile overview
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {stats.map(([label, value, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 transition hover:border-[rgba(34,211,238,0.28)]"
              >
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-black text-sangria">{value}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/account/profile"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Edit Demo Profile
            </Link>
            <Link
              href="/account/wishlist"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Open Wishlist
            </Link>
            <Link
              href="/account/addresses"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Manage Addresses
            </Link>
            <Link
              href="/account/cart-sync"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Cart Sync Prep
            </Link>
            <Link
              href="/cart"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Review Cart
            </Link>
          </div>
          <p className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            Demo account area. Real authentication, cloud sync, and private
            database user persistence are not connected yet.
          </p>
        </Card>

        <OrderHistoryDemo />
      </div>
    </AccountShell>
  );
}
