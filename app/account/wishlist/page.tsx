import { AccountShell } from "@/components/account/account-shell";
import { StylePreferences } from "@/components/account/style-preferences";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export default function AccountWishlistPage() {
  return (
    <AccountShell
      eyebrow="Wishlist beta"
      title="Saved product signal."
      description="Review products saved from the shop and product pages. Wishlist beta is browser-local for now; real account persistence comes later."
      aside={<StylePreferences />}
    >
      <WishlistGrid />
    </AccountShell>
  );
}
