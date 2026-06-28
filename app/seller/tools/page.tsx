import { SellerAiToolsPreview } from "@/components/seller/seller-ai-tools-preview";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";

export default function SellerToolsPage() {
  return (
    <SellerDashboardShell
      eyebrow="AI tools preview"
      title="Seller tooling preview"
      description="Future seller-assist tools are shown as beta previews only. SKXNZ does not auto-publish products, generate live video assets, or enhance images in production from this dashboard yet."
    >
      <SellerAiToolsPreview />
    </SellerDashboardShell>
  );
}
