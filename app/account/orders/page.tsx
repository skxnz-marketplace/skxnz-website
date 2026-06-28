import { AccountShell } from "@/components/account/account-shell";
import { OrderHistoryDemo } from "@/components/account/order-history-demo";

export default function AccountOrdersPage() {
  return (
    <AccountShell
      eyebrow="Orders"
      title="Order history demo."
      description="View seeded buyer order placeholders and the latest local demo checkout. Real order history is not connected to account persistence yet."
    >
      <OrderHistoryDemo />
    </AccountShell>
  );
}
