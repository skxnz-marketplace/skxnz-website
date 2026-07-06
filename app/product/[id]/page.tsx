import type { Metadata } from "next";

import { ProductDetailShell } from "@/components/buyer/product-detail-shell";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { getActiveProductBySlug, getProductById } from "@/lib/catalog/queries";
import {
  getProductById as getSeedProductById,
  products,
  type Product,
} from "@/lib/data/products";

export const revalidate = 300;
const LIVE_PRODUCT_LOOKUP_TIMEOUT_MS = 2500;

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

async function resolveLiveProduct(id: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn("[product] live product lookup timed out; falling back to local product data.");
      controller.abort();
      resolve(null);
    }, LIVE_PRODUCT_LOOKUP_TIMEOUT_MS);
  });

  const lookup = async () =>
    (await getActiveProductBySlug(id, controller.signal)) ??
    (await getProductById(id, controller.signal));

  try {
    return await Promise.race([lookup(), timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function resolveProduct(id: string): Promise<Product | null> {
  try {
    const liveProduct = await resolveLiveProduct(id);

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
