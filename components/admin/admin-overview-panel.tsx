"use client";

import Link from "next/link";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { demoAdminAnalyticsCards, seedAdminCommunityReports } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/data/orders";

const focusLinks = [
  {
    title: "Products",
    description: "Approve, reject, and review catalog readiness.",
    href: "/admin/products",
  },
  {
    title: "Sellers",
    description: "Review applications without activating live verification.",
    href: "/admin/sellers",
  },
  {
    title: "Community",
    description: "Moderation foundation for reports and demo post actions.",
    href: "/admin/community",
  },
  {
    title: "Content",
    description: "Review hero, brand, category, and collection surfaces.",
    href: "/admin/content",
  },
];

export function AdminOverviewPanel() {
  const {
    catalog,
    pendingReviewProducts,
    sellerApplications,
    orders,
    supportTickets,
  } = useMarketplace();
  const demoOrderTotal = orders.reduce((total, order) => total + order.amount, 0);

  const overviewMetrics = [
    {
      name: "Total Products",
      value: catalog.length.toString().padStart(2, "0"),
      trend: "Demo catalog",
      description: "Central product data and local seller submissions.",
    },
    {
      name: "Pending Reviews",
      value: pendingReviewProducts.length.toString().padStart(2, "0"),
      trend: "Product queue",
      description: "Products awaiting internal approval in MVP state.",
    },
    {
      name: "Seller Applications",
      value: sellerApplications.length.toString().padStart(2, "0"),
      trend: "Review beta",
      description: "Browser-local seller onboarding records.",
    },
    {
      name: "Demo Orders",
      value: orders.length.toString().padStart(2, "0"),
      trend: "No live checkout",
      description: "Seeded order lifecycle rows for operations review.",
    },
    {
      name: "Community Reports",
      value: seedAdminCommunityReports.length.toString().padStart(2, "0"),
      trend: "Moderation foundation",
      description: "Seeded reports plus local reports on the moderation page.",
    },
    {
      name: "Support Tickets",
      value: supportTickets.length.toString().padStart(2, "0"),
      trend: "Demo queue",
      description: "Buyer and seller support records in local MVP state.",
    },
    {
      name: "Demo Users",
      value: "04",
      trend: "Account beta",
      description: "Buyer, seller, and admin demo profiles only.",
    },
    {
      name: "Revenue Demo",
      value: formatCurrency(demoOrderTotal),
      trend: "Internal only",
      description: "Order amount placeholder. No payment settlement is live.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <StatCard key={metric.name} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Internal Control Center
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            Keep every launch-critical queue visible.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-silver">
            This admin back office is an internal foundation. It uses demo and
            browser-local state only while production auth, database writes,
            payments, fulfillment, and moderation workflows remain offline.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {focusLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-teal/30"
              >
                <p className="font-display text-lg uppercase tracking-[0.14em] text-pearl">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-silver">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            MVP Boundaries
          </p>
          <div className="mt-6 space-y-4">
            {[
              "Production role-based access is required before public launch.",
              "Seller approvals are demo actions and do not activate payouts.",
              "Revenue and payments are internal placeholders only.",
              "Community hide/delete actions are moderation UI demos.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver"
              >
                <span className="signal-dot inline-flex items-start">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <DataTable
        eyebrow="Operations Snapshot"
        title="Current admin queues"
        description="High-signal queues across products, sellers, orders, community, support, and content control."
        columns={["Area", "Status", "Next Action", "Safety Note"]}
        rows={[
          {
            id: "products",
            cells: [
              "Products",
              <StatusBadge key="product-status" label={`${pendingReviewProducts.length} Pending`} />,
              "Review product image, copy, flags, and buyer visibility.",
              "Approval is browser-local only in this MVP.",
            ],
          },
          {
            id: "sellers",
            cells: [
              "Sellers",
              <StatusBadge key="seller-status" label={`${sellerApplications.length} Applications`} />,
              "Review readiness, category fit, and operating notes.",
              "No real seller verification or payouts are connected.",
            ],
          },
          {
            id: "community",
            cells: [
              "Community",
              <StatusBadge key="community-status" label={`${seedAdminCommunityReports.length} Reports`} />,
              "Moderate reported demo posts and refine rules.",
              "No public posting or live moderation outcome is claimed.",
            ],
          },
          {
            id: "analytics",
            cells: [
              "Analytics",
              <StatusBadge key="analytics-status" label="Demo Cards" />,
              "Prepare metric surfaces for later analytics provider wiring.",
              demoAdminAnalyticsCards[5]?.description ?? "No real revenue metric is connected.",
            ],
          },
        ]}
      />
    </div>
  );
}
