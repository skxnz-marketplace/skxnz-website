import { formatCurrency, type MarketplaceOrder } from "@/lib/data/orders";
import type { Product } from "@/src/data/demo-products";

export type SellerDashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type SellerAnalyticsCard = {
  label: string;
  value: string;
  detail: string;
};

export type SellerToolPreview = {
  title: string;
  status: "Preview" | "Coming soon";
  description: string;
};

export function getSellerDashboardStats(
  products: Product[],
  orders: MarketplaceOrder[],
): SellerDashboardStat[] {
  const pendingProducts = products.filter(
    (product) => product.status === "Pending Review",
  ).length;
  const demoRevenue = orders.reduce((total, order) => total + order.amount, 0);
  const returnRequests = orders.filter(
    (order) => order.returnStatus !== "Not Requested",
  ).length;

  return [
    {
      label: "Total demo products",
      value: String(products.length),
      detail: "Local catalog and submitted review items.",
    },
    {
      label: "Demo orders",
      value: String(orders.length),
      detail: "Seeded seller order visibility only.",
    },
    {
      label: "Demo revenue",
      value: formatCurrency(demoRevenue),
      detail: "Placeholder value. No real payouts are connected.",
    },
    {
      label: "Pending review",
      value: String(pendingProducts),
      detail: "Products waiting for internal review.",
    },
    {
      label: "Return requests demo",
      value: String(returnRequests),
      detail: "Return workflow preview. Refunds are not live.",
    },
  ];
}

export const sellerAnalyticsCards: SellerAnalyticsCard[] = [
  {
    label: "Views",
    value: "12.4K",
    detail: "Demo storefront impressions for UI planning.",
  },
  {
    label: "Saves",
    value: "842",
    detail: "Wishlist-style saves preview. Not synced to backend yet.",
  },
  {
    label: "Orders",
    value: "38",
    detail: "Demo order activity for analytics layout only.",
  },
  {
    label: "Conversion estimate",
    value: "3.1%",
    detail: "Placeholder estimate. No production analytics connected.",
  },
  {
    label: "Revenue demo",
    value: "₹1.24L",
    detail: "Dashboard-only mock number. Payouts are not connected.",
  },
];

export const sellerToolPreviews: SellerToolPreview[] = [
  {
    title: "AI product description helper",
    status: "Preview",
    description:
      "Draft-support workflow for future seller copy review. Outputs still require human review before publishing.",
  },
  {
    title: "AI tag generator",
    status: "Preview",
    description:
      "Suggested category and style tags for internal seller tooling experiments.",
  },
  {
    title: "AI product video generator",
    status: "Coming soon",
    description:
      "Future product video workflow placeholder. No video generation is live.",
  },
  {
    title: "AI image enhancement",
    status: "Coming soon",
    description:
      "Future image cleanup workflow placeholder. No image enhancement is live.",
  },
];
