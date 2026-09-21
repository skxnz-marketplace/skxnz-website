import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGalleryManager } from "@/components/catalog/product-gallery-manager";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type SellerProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SellerProductDetailPage({ params }: SellerProductDetailPageProps) {
  const { id } = await params;
  await requireRole(["SELLER", "ADMIN"], `/seller/products/${id}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, seller_id")
    .eq("id", id)
    .maybeSingle();

  // RLS already prevents a seller reading another seller's product row, so
  // a missing row here means either it doesn't exist or isn't theirs —
  // either way, 404 rather than leaking which.
  if (!product || (product.seller_id !== user?.id && product.seller_id !== null)) {
    notFound();
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  return (
    <SellerDashboardShell
      eyebrow="Product photos"
      title={product.name}
      description="Upload real photos and set their order. The first photo is the product's main image everywhere it appears."
      actions={
        <Link
          href="/seller/products"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Back to Products
        </Link>
      }
    >
      <ProductGalleryManager
        productId={id}
        initialImages={(images ?? []).map((image) => ({ id: image.id, url: image.url }))}
      />
    </SellerDashboardShell>
  );
}
