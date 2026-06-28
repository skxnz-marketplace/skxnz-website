import { ProductCard } from "@/components/sections/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { Product } from "@/lib/data/products";

type ProductGridProps = {
  products: Product[];
  emptyTitle?: string;
  emptyDescription?: string;
  showWishlistAction?: boolean;
};

export function ProductGrid({
  products,
  emptyTitle = "No products yet.",
  emptyDescription = "Add placeholder products to start testing the catalog layout.",
  showWishlistAction = false,
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showWishlistAction={showWishlistAction}
        />
      ))}
    </div>
  );
}
