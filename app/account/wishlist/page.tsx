import { AccountSavedItems } from "@/components/account/account-saved-items";
import { AccountShell } from "@/components/account/account-shell";
import { StylePreferences } from "@/components/account/style-preferences";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export const dynamic = "force-dynamic";

export default function AccountWishlistPage() {
  return (
    <AccountShell
      eyebrow="Saved products"
      title="Saved product signal."
      description="Account-synced saves appear at the top once connected. Products saved on this device are shown below and always work."
      aside={<StylePreferences />}
    >
      <div className="space-y-6">
        <AccountSavedItems />
        <WishlistGrid />
      </div>
    </AccountShell>
  );
}
