import type { Metadata } from "next";

import { ProductDetailShell } from "@/components/buyer/product-detail-shell";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { getProductById } from "@/lib/catalog/queries";
import {
  getProductById as getSeedProductById,
  products,
  type Product,
} from "@/lib/data/products";

export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

async function resolveProduct(id: string): Promise<Product | null> {
  try {
    const liveProduct = await getProductById(id);

    if (liveProduct) {
      return mapCatalogProductToBuyerProduct(liveProduct);
    }
  } catch (err) {
    console.warn("[product] falling back to local product data:", err);
  }

  return getSeedProductById(id) ?? null;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await resolveProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await resolveProduct(id);

  return <ProductDetailShell productId={id} seedProduct={product} />;
}
