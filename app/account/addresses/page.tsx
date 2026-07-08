import { AccountShell } from "@/components/account/account-shell";
import { AddressBookLive } from "@/components/account/address-book-live";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/roles";
import { getBuyerAddressBook } from "@/lib/orders/read-buyer-addresses";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  await requireUser("/account/addresses");
  const { backendReady, addresses } = await getBuyerAddressBook();

  return (
    <AccountShell
      eyebrow="Addresses"
      title="Address book."
      description="Save the delivery addresses you use at checkout. They are stored on your SKXNZ account and only you can see them."
    >
      {backendReady ? (
        <AddressBookLive initialAddresses={addresses} />
      ) : (
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Addresses not connected yet
          </p>
          <p className="mt-3 text-sm leading-7 text-stone">
            Address storage is not connected yet. Nothing was lost — no addresses
            exist. This connects when the account database is applied.
          </p>
        </Card>
      )}
    </AccountShell>
  );
}
