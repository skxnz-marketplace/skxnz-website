import { AccountShell } from "@/components/account/account-shell";
import { AddressBook } from "@/components/account/address-book";

export default function AccountAddressesPage() {
  return (
    <AccountShell
      eyebrow="Addresses"
      title="Address book."
      description="Manage local demo addresses for checkout rehearsal. Real account address persistence is not connected yet."
    >
      <AddressBook />
    </AccountShell>
  );
}
