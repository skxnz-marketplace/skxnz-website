import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { sellerAnalyticsCards } from "@/lib/data/seller-dashboard";

export function SellerAnalyticsDemo() {
  return (
    <Card className="rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_55px_rgba(58,8,24,0.07)] sm:p-7">
      <Badge>Analytics demo</Badge>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
        Seller performance preview
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-stone">
        These cards are dashboard placeholders for future analytics. They are not real
        sales, payout, or production tracking data.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {sellerAnalyticsCards.map((card) => (
          <div
            key={card.label}
            className="min-w-0 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)] p-5"
          >
            <p className="line-clamp-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone">
              {card.label}
            </p>
            <p className="mt-3 truncate text-2xl font-black text-sangria">
              {card.value}
            </p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone">
              {card.detail}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
