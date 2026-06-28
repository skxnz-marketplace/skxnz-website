import { homepageHeroes } from "@/src/data/homepageHeroes";
import { demoBrands } from "@/lib/data/brands";
import { products } from "@/lib/data/products";
import { seedCommunityPosts } from "@/lib/data/community";

export type DemoAdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Buyer Demo" | "Seller Demo" | "Admin Demo";
  wishlistCount: number;
  ordersCount: number;
  status: "Demo Active" | "Needs Review" | "Internal Only";
  city: string;
};

export type DemoAdminContentItem = {
  id: string;
  area: string;
  title: string;
  status: "Active Demo" | "Draft Demo" | "Needs Review";
  owner: string;
  updatedAt: string;
  note: string;
};

export type DemoAdminAnalyticsCard = {
  label: string;
  value: string;
  trend: string;
  description: string;
};

export type DemoAdminCommunityReport = {
  id: string;
  postId: string;
  username: string;
  reason: string;
  status: "New Demo" | "Hidden Demo" | "Dismissed Demo" | "Delete UI Demo";
  createdAt: string;
  note: string;
};

export const demoAdminUsers: DemoAdminUser[] = [
  {
    id: "user_buyer_demo",
    name: "Demo Buyer",
    email: "demo-buyer@skxnz.local",
    role: "Buyer Demo",
    wishlistCount: 3,
    ordersCount: 4,
    status: "Demo Active",
    city: "Mumbai",
  },
  {
    id: "user_buyer_rhea",
    name: "Rhea K.",
    email: "rhea.demo@skxnz.local",
    role: "Buyer Demo",
    wishlistCount: 2,
    ordersCount: 1,
    status: "Demo Active",
    city: "Delhi",
  },
  {
    id: "user_seller_demo",
    name: "Demo Seller Studio",
    email: "demo-seller@skxnz.local",
    role: "Seller Demo",
    wishlistCount: 0,
    ordersCount: 2,
    status: "Needs Review",
    city: "Mumbai",
  },
  {
    id: "admin_user_01",
    name: "SKXNZ Admin Demo",
    email: "admin-demo@skxnz.local",
    role: "Admin Demo",
    wishlistCount: 0,
    ordersCount: 0,
    status: "Internal Only",
    city: "Internal",
  },
];

export const demoAdminContentItems: DemoAdminContentItem[] = [
  ...homepageHeroes.map((hero) => ({
    id: hero.id,
    area: "Homepage hero slides",
    title: hero.title,
    status: hero.status === "Active" ? "Active Demo" as const : "Draft Demo" as const,
    owner: "SKXNZ Content",
    updatedAt: "Sheet seed",
    note: "Hero slide content is sheet-based demo data. Full CMS is not connected.",
  })),
  {
    id: "content-top-brands",
    area: "Top brand toolbar",
    title: `${demoBrands.slice(0, 4).map((brand) => brand.name).join(", ")}...`,
    status: "Active Demo",
    owner: "Brand Discovery",
    updatedAt: "MVP seed",
    note: "Brand ordering uses demo ranking logic and does not claim partnerships.",
  },
  {
    id: "content-category-tiles",
    area: "Category tiles",
    title: "Men, Women, Perfume, Accessories, Streetwear",
    status: "Active Demo",
    owner: "Catalog",
    updatedAt: "MVP seed",
    note: "Category tiles route into polished category pages using central product data.",
  },
  {
    id: "content-featured-collections",
    area: "Featured collections",
    title: "Limited Edition, New Season, AI Styled",
    status: "Needs Review",
    owner: "Marketplace Ops",
    updatedAt: "MVP seed",
    note: "Collection flags are demo metadata only and need admin tooling later.",
  },
];

export const demoAdminAnalyticsCards: DemoAdminAnalyticsCard[] = [
  {
    label: "Visits Demo",
    value: "12.8K",
    trend: "Internal estimate",
    description: "Placeholder traffic card for future analytics wiring.",
  },
  {
    label: "Product Views Demo",
    value: "46.2K",
    trend: "Catalog seed",
    description: "Demo view metric. No real analytics provider is connected.",
  },
  {
    label: "Search Queries Demo",
    value: "1.9K",
    trend: "Search beta",
    description: "Search query summary placeholder for Phase 2A validation.",
  },
  {
    label: "Community Engagement Demo",
    value: "328",
    trend: "Local signals",
    description: "Represents local likes/saves/reports, not public social metrics.",
  },
  {
    label: "Seller Applications Demo",
    value: "4",
    trend: "Review queue",
    description: "Seeded seller applications in browser-local admin review state.",
  },
  {
    label: "Revenue Demo",
    value: "₹0 live",
    trend: "Payments offline",
    description: "Revenue card intentionally avoids claiming real payment settlement.",
  },
];

export const seedAdminCommunityReports: DemoAdminCommunityReport[] =
  seedCommunityPosts.slice(0, 4).map((post, index) => ({
    id: `CMR-${301 + index}`,
    postId: post.id,
    username: post.username,
    reason:
      index === 0
        ? "Fake product claim"
        : index === 1
          ? "Copyright concern"
          : index === 2
            ? "Spam"
            : "Other",
    status: "New Demo",
    createdAt: post.timeLabel,
    note:
      "Moderation foundation only. Real hide, takedown, and admin audit logs are not connected.",
  }));

export function getAdminProductSignalCounts() {
  return {
    totalProducts: products.length,
    featuredProducts: products.filter((product) =>
      product.tags.some((tag) => tag.toLowerCase().includes("featured")),
    ).length,
    limitedEditionProducts: products.filter((product) =>
      [...product.tags, ...product.collections]
        .join(" ")
        .toLowerCase()
        .includes("limited"),
    ).length,
  };
}
