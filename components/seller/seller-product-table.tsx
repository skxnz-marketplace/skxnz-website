"use client";

import Image from "next/image";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getSellerProducts,
  getSellerProductStatusTone,
  resolveSellerDemoProductStatus,
} from "@/lib/data/seller-products";
import { formatCurrency } from "@/lib/data/orders";
import { ensureProductAsset } from "@/src/lib/assets";
import { cn } from "@/lib/cn";

export function SellerProductTable() {
  const { catalog } = useMarketplace();
  const products = getSellerProducts(catalog);

  return (
    <Card className="overflow-hidden rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] shadow-[0_18px_55px_rgba(58,8,24,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[rgba(58,8,24,0.10)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Badge>Product review workspace</Badge>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
            Demo product table
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone">
            Products here are beta records. Seller uploads stay pending until internal review.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[var(--skxnz-bg-soft)] text-[0.64rem] uppercase tracking-[0.18em] text-stone">
              <th className="px-5 py-4 font-black">Product</th>
              <th className="px-5 py-4 font-black">Category</th>
              <th className="px-5 py-4 font-black">Price</th>
              <th className="px-5 py-4 font-black">Inventory</th>
              <th className="px-5 py-4 font-black">Status</th>
              <th className="px-5 py-4 font-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = resolveSellerDemoProductStatus(product.status);

              return (
                <tr
                  key={product.id}
                  className="border-b border-[rgba(58,8,24,0.08)] text-sm text-midnightbrown"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)]">
                        <Image
                          src={ensureProductAsset(product.image)}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-black">{product.name}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-stone">
                          {product.brandName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="line-clamp-1">{product.category}</span>
                  </td>
                  <td className="px-5 py-4 font-black text-sangria">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-5 py-4">{product.stock}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex max-w-full rounded-full border px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.14em]",
                        getSellerProductStatusTone(status),
                      )}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                          className: "text-[0.6rem]",
                        })}
                      >
                        Edit demo
                      </button>
                      <button
                        type="button"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className: "text-[0.6rem]",
                        })}
                      >
                        Remove demo
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
