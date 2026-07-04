import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { SellerProductUploadDemo } from "@/components/seller/seller-product-upload-demo";
import { getSellerProductsWithRelations } from "@/lib/catalog/queries";

export default async function SellerProductsPage() {
  const products = await getSellerProductsWithRelations();

  return (
    <SellerDashboardShell
      eyebrow="Seller products beta"
      title="Products and review queue"
      description="Review seller-owned Supabase products. Product creation remains in demo mode until the next backend step connects submissions safely."
    >
      <div className="space-y-6">
        <SellerProductUploadDemo />
        <SellerProductTable liveProducts={products} />
      </div>
    </SellerDashboardShell>
  );
}
