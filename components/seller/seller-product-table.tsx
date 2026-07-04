"use client";

import Image from "next/image";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ProductStatus as CatalogProductStatus,
  ProductWithRelations,
} from "@/lib/catalog/types";
import {
  getSellerProducts,
  getSellerProductStatusTone,
  resolveSellerDemoProductStatus,
} from "@/lib/data/seller-products";
import { formatCurrency } from "@/lib/data/orders";
import { ensureProductAsset } from "@/src/lib/assets";
import { cn } from "@/lib/cn";

type SellerProductTableProps = {
  liveProducts?: ProductWithRelations[];
};

type SellerProductRow = {
  id: string;
  name: string;
  brandName: string;
  category: string;
  price: number;
  stock: number;
  status: CatalogProductStatus | ReturnType<typeof resolveSellerDemoProductStatus>;
  image: string;
  updatedAt: string;
  isLive: boolean;
};

function getLiveProductStatusTone(status: CatalogProductStatus) {
  if (status === "ACTIVE") {
    return "border-[rgba(47,111,115,0.24)] bg-[rgba(47,111,115,0.08)] text-teal";
  }

  if (status === "REJECTED") {
    return "border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] text-sangria";
  }

  if (status === "ARCHIVED") {
    return "border-[rgba(58,8,24,0.16)] bg-white text-midnightbrown";
  }

  return "border-[rgba(34,211,238,0.26)] bg-[rgba(34,211,238,0.07)] text-sangria";
}

function mapLiveProductToRow(product: ProductWithRelations): SellerProductRow {
  return {
    id: product.id,
    name: product.name,
    brandName: product.brand?.name ?? "Unassigned brand",
    category: product.category?.name ?? "Unassigned category",
    price: product.price_inr,
    stock: product.variants.reduce(
      (total, variant) => total + variant.stock_quantity,
      0,
    ),
    status: product.status,
    image: product.images[0]?.url ?? product.image_url ?? "",
    updatedAt: product.updated_at,
    isLive: true,
  };
}

export function SellerProductTable({ liveProducts }: SellerProductTableProps) {
  const { catalog } = useMarketplace();
  const products: SellerProductRow[] = liveProducts
    ? liveProducts.map(mapLiveProductToRow)
    : getSellerProducts(catalog).map((product) => ({
        id: product.id,
        name: product.name,
        brandName: product.brandName,
        category: product.category,
        price: product.price,
        stock: product.stock,
        status: resolveSellerDemoProductStatus(product.status),
        image: product.image,
        updatedAt: product.updatedAt,
        isLive: false,
      }));
  const isLiveMode = Boolean(liveProducts);

  return (
    <Card className="overflow-hidden rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] shadow-[0_18px_55px_rgba(58,8,24,0.07)]">
      <div className="flex flex-col gap-3 border-b border-[rgba(58,8,24,0.10)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Badge>{isLiveMode ? "Live seller products" : "Product review workspace"}</Badge>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
            {isLiveMode ? "Supabase product table" : "Demo product table"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone">
            {isLiveMode
              ? "Products here are read from Supabase for the current seller. Status changes and creation are not connected here yet."
              : "Products here are beta records. Seller uploads stay pending until internal review."}
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
              const statusTone = product.isLive
                ? getLiveProductStatusTone(product.status as CatalogProductStatus)
                : getSellerProductStatusTone(product.status as ReturnType<typeof resolveSellerDemoProductStatus>);

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
                        statusTone,
                      )}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {product.isLive ? (
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone">
                        Read-only
                      </span>
                    ) : (
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
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 ? (
        <div className="border-t border-[rgba(58,8,24,0.10)] p-6 text-sm leading-6 text-stone">
          No seller-owned products were found in Supabase for this account yet.
        </div>
      ) : null}
    </Card>
  );
}
