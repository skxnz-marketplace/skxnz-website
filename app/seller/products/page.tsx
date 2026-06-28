import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { SellerProductUploadDemo } from "@/components/seller/seller-product-upload-demo";

export default function SellerProductsPage() {
  return (
    <SellerDashboardShell
      eyebrow="Seller products beta"
      title="Products and review queue"
      description="Upload demo products, review local seller catalog records, and confirm every submitted product stays pending internal review until a future database workflow is connected."
    >
      <div className="space-y-6">
        <SellerProductUploadDemo />
        <SellerProductTable />
      </div>
    </SellerDashboardShell>
  );
}
