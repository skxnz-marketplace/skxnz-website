"use client";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Card } from "@/components/ui/card";
import { getSellerDashboardStats } from "@/lib/data/seller-dashboard";

export function SellerStatsCards() {
  const { catalog, orders } = useMarketplace();
  const stats = getSellerDashboardStats(catalog, orders);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="min-w-0 rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] p-5 shadow-[0_16px_40px_rgba(58,8,24,0.06)]"
        >
          <p className="line-clamp-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone">
            {stat.label}
          </p>
          <p className="mt-3 truncate text-2xl font-black text-sangria">
            {stat.value}
          </p>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone">
            {stat.detail}
          </p>
        </Card>
      ))}
    </div>
  );
}
