import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminProductPlacementPanel } from "@/components/admin/admin-product-placement-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { ProductGalleryManager } from "@/components/catalog/product-gallery-manager";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { createClient } from "@/lib/supabase/server";

type AdminProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailPage({ params }: AdminProductDetailPageProps) {
  const { id } = await params;
  await requireRole(["ADMIN"], `/admin/products/${id}`);

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, is_featured, is_limited, trending_sort_order")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin product photos and placement"
      helperText="This area requires the admin demo role to preview. Real access is enforced server-side by RLS regardless of this local role switch."
    >
      <DashboardShell
        eyebrow="Photos & Placement"
        title={product.name}
        description="Manage this product's photo gallery and homepage placement."
        actions={
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Back to Products
          </Link>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/products"
      >
        <div className="space-y-6">
          <AdminProductPlacementPanel
            productId={id}
            initialIsFeatured={product.is_featured}
            initialIsLimited={product.is_limited}
            initialTrendingOrder={product.trending_sort_order}
          />
          <ProductGalleryManager
            productId={id}
            initialImages={(images ?? []).map((image) => ({ id: image.id, url: image.url }))}
          />
        </div>
      </DashboardShell>
    </DemoRoleGate>
  );
}
