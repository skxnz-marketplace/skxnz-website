import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { getProductHref } from "@/lib/catalog/product-links";
import { formatProductPrice, type Product } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type TaggedProductsStripProps = {
  products: Product[];
  compact?: boolean;
};

export function TaggedProductsStrip({
  products,
  compact = false,
}: TaggedProductsStripProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-[18px] border border-[var(--skxnz-border)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-xs leading-5 text-[var(--skxnz-text-muted)]">
        No tagged SKXNZ products in this demo post.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {products.map((product) => (
        <Link
          key={product.id}
          href={getProductHref(product)}
          className="group flex min-w-0 items-center gap-3 rounded-[18px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-2 transition hover:border-[rgba(34,211,238,0.38)]"
        >
          <div
            className={`relative shrink-0 overflow-hidden rounded-[14px] bg-[var(--skxnz-bg-soft)] ${
              compact ? "h-12 w-12" : "h-14 w-14"
            }`}
          >
            <SafeImage
              src={product.image}
              fallbackSrc={skxnzFallbackAssets.product}
              alt={product.name}
              fill
              sizes={compact ? "48px" : "56px"}
              className="object-cover object-center transition group-hover:scale-[1.04]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--skxnz-text-dark)]">
              {product.name}
            </p>
            <p className="mt-1 line-clamp-1 text-[0.7rem] text-[var(--skxnz-text-muted)]">
              {product.brandName} · {formatProductPrice(product.salePrice ?? product.price)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
