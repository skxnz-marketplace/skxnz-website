import { AccountShell } from "@/components/account/account-shell";
import { CartSyncStatusPanel } from "@/components/account/cart-sync-status";

export default function AccountCartSyncPage() {
  return (
    <AccountShell
      eyebrow="Cart sync prep"
      title="Cart sync ready."
      description="Review the local guest cart bridge that will support future logged-in account cart persistence."
    >
      <CartSyncStatusPanel />
    </AccountShell>
  );
}
