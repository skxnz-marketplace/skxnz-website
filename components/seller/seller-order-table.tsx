"use client";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSellerDemoOrderRows } from "@/lib/data/seller-orders";

export function SellerOrderTable() {
  const { orders } = useMarketplace();
  const rows = getSellerDemoOrderRows(orders);

  return (
    <Card className="overflow-hidden rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] shadow-[0_18px_55px_rgba(58,8,24,0.07)]">
      <div className="border-b border-[rgba(58,8,24,0.10)] p-5">
        <Badge>Seller orders demo</Badge>
        <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
          Order list
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone">
          Seeded internal orders for seller workflow review. No real delivery, payment, or payout is connected.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[var(--skxnz-bg-soft)] text-[0.64rem] uppercase tracking-[0.18em] text-stone">
              <th className="px-5 py-4 font-black">Order ID</th>
              <th className="px-5 py-4 font-black">Product</th>
              <th className="px-5 py-4 font-black">Buyer demo name</th>
              <th className="px-5 py-4 font-black">Qty</th>
              <th className="px-5 py-4 font-black">Amount</th>
              <th className="px-5 py-4 font-black">Status</th>
              <th className="px-5 py-4 font-black">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="text-sm text-midnightbrown">
                <td className="px-5 py-4 font-black">{row.id}</td>
                <td className="px-5 py-4">
                  <p className="line-clamp-2 font-bold">{row.product}</p>
                  <p className="mt-1 text-xs text-stone">{row.dispatchStatus}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="line-clamp-1">{row.buyerName}</p>
                  <p className="mt-1 text-xs text-stone">{row.buyerCity}</p>
                </td>
                <td className="px-5 py-4">{row.quantity}</td>
                <td className="px-5 py-4 font-black text-sangria">{row.amount}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.07)] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.14em] text-sangria">
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-stone">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
