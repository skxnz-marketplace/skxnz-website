import { SellerAnalyticsDemo } from "@/components/seller/seller-analytics-demo";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";

export default function SellerAnalyticsPage() {
  return (
    <SellerDashboardShell
      eyebrow="Seller analytics demo"
      title="Analytics preview"
      description="A beta performance surface for future seller insights. Metrics are placeholders and should not be read as production revenue, real orders, or live conversion tracking."
    >
      <SellerAnalyticsDemo />
    </SellerDashboardShell>
  );
}
