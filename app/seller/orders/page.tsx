import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerOrderTable } from "@/components/seller/seller-order-table";

export default function SellerOrdersPage() {
  return (
    <SellerDashboardShell
      eyebrow="Seller orders demo"
      title="Order visibility"
      description="Review seeded seller order states for internal testing. Payment capture, dispatch automation, live delivery tracking, returns processing, and payouts are not connected."
    >
      <SellerOrderTable />
    </SellerDashboardShell>
  );
}
