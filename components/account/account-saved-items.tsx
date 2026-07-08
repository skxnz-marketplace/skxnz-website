// SERVER COMPONENT — account-synced saved items (D5-1).
//
// Reads public.saved_items for the signed-in buyer via getSavedItems() and
// renders honest states. This is the ACCOUNT-synced path, kept clearly
// separate from the device-local wishlist grid below it. It never pretends
// logged-out or device-local saves are synced.

import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatProductPrice } from "@/lib/data/products";
import { getSavedItems } from "@/lib/saved/read-saved-items";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export async function AccountSavedItems() {
  const result = await getSavedItems();

  if (!result.authenticated) {
    return (
      <PanelShell status="Sign in to sync">
        <p className="text-sm leading-6 text-stone">
          Sign in to save products to your SKXNZ account so they follow you
          across devices. Products you save while signed out stay on this
          device only.
        </p>
      </PanelShell>
    );
  }

  if (!result.backendReady) {
    return (
      <PanelShell status="Account sync not connected yet">
        <p className="text-sm leading-6 text-stone">
          Account-synced saved items are not connected yet. Your device-local
          wishlist below still works. Nothing was lost.
        </p>
      </PanelShell>
    );
  }

  if (result.items.length === 0) {
    return (
      <PanelShell status="No account-synced saves yet">
        <p className="text-sm leading-6 text-stone">
          You have not saved any products to your account yet. Saved products
          will appear here.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell status={`${result.items.length} synced`}>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.items.map((item) => (
          <Card
            key={item.id}
            className="section-border flex h-full min-w-0 flex-col rounded-[26px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-3"
          >
            <Link
              href={`/product/${item.productSlug}`}
              className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)]"
            >
              <SafeImage
                src={item.imageUrl ?? ""}
                fallbackSrc={skxnzFallbackAssets.product}
                alt={item.productTitle}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center"
              />
            </Link>
            <div className="mt-3 flex min-w-0 flex-1 flex-col">
              {item.brandName ? (
                <p className="line-clamp-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-sangria">
                  {item.brandName}
                </p>
              ) : null}
              <Link href={`/product/${item.productSlug}`}>
                <h3 className="mt-1 line-clamp-2 break-words text-sm font-bold leading-tight text-midnightbrown">
                  {item.productTitle}
                </h3>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-2">
                {item.priceInr != null ? (
                  <p className="product-price text-sm font-black text-sangria">
                    {formatProductPrice(item.priceInr)}
                  </p>
                ) : (
                  <span className="text-xs text-stone">Price at product page</span>
                )}
                {item.selectedSize ? <Badge>{item.selectedSize}</Badge> : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PanelShell>
  );
}

function PanelShell({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="section-border rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Account saved items
        </p>
        <Badge>{status}</Badge>
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
