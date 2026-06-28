import { AccountShell } from "@/components/account/account-shell";
import { StylePreferences } from "@/components/account/style-preferences";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export default function WishlistPage() {
  return (
    <AccountShell
      eyebrow="Wishlist beta"
      title="Saved product signal."
      description="Save SKXNZ products from cards and product detail pages. Wishlist beta is saved locally for now; persistent account sync comes later."
      aside={<StylePreferences />}
    >
      <WishlistGrid />
    </AccountShell>
  );
}
