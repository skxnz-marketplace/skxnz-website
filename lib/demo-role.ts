export type DemoRole = "buyer" | "seller" | "admin";

export type DemoNavLink = {
  href: string;
  label: string;
};

export const demoRoleSummaries: Record<
  DemoRole,
  {
    label: string;
    description: string;
    defaultHref: string;
  }
> = {
  buyer: {
    label: "Buyer",
    description:
      "Browse the private catalog, save wishlist picks, review orders and returns, open the buyer account placeholder, and create support tickets.",
    defaultHref: "/shop",
  },
  seller: {
    label: "Seller",
    description:
      "Review the seller dashboard, product workspace, inventory structure, and seeded order visibility.",
    defaultHref: "/seller",
  },
  admin: {
    label: "Admin",
    description:
      "Open the moderation queues, return reviews, support tables, and order operations preview for internal testing.",
    defaultHref: "/admin",
  },
};

export const guestNavLinks: DemoNavLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/community", label: "Community Beta" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login / Private MVP" },
];

export const buyerNavLinks: DemoNavLink[] = [
  { href: "/shop", label: "Shop" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/returns", label: "Returns" },
  { href: "/account", label: "Account" },
  { href: "/support", label: "Support" },
];

export const sellerNavLinks: DemoNavLink[] = [
  { href: "/seller", label: "Seller Dashboard" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/tools", label: "AI Tools Preview" },
];

export const adminNavLinks: DemoNavLink[] = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/analytics", label: "Analytics" },
];

export const footerUtilityLinks: DemoNavLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/community", label: "Community Beta" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function getDemoNavLinks(role: DemoRole | null) {
  if (role === "buyer") {
    return buyerNavLinks;
  }

  if (role === "seller") {
    return sellerNavLinks;
  }

  if (role === "admin") {
    return adminNavLinks;
  }

  return guestNavLinks;
}
