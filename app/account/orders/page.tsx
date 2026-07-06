import { AccountShell } from "@/components/account/account-shell";
import { OrderReadinessPanel } from "@/components/orders/order-readiness-panel";

// NOTE: The seeded demo order history (OrderHistoryDemo) is intentionally not
// rendered here. Buyers must never see mock orders presented as history.
// Real order history returns to this page once orders are created server-side
// after live payment is connected.

export default function AccountOrdersPage() {
  return (
    <AccountShell
      eyebrow="Orders"
      title="No order has been placed yet."
      description="Order history will appear here after live payment is connected. SKXNZ does not show placeholder or mock orders."
    >
      <OrderReadinessPanel />
    </AccountShell>
  );
}
