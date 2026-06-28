import { Card } from "@/components/ui/card";

const applicantTypes = [
  "Independent brands",
  "Curated boutiques",
  "Streetwear sellers",
  "Designers",
  "Vintage sellers",
  "Resellers with clear sourcing",
];

const benefits = [
  {
    title: "Premium product context",
    description: "Image-first product discovery.",
  },
  {
    title: "Manual internal review",
    description: "Brand fit and assortment quality.",
  },
  {
    title: "Future seller tools",
    description: "Dashboard, uploads, and review queues.",
  },
];

export function SellerBenefits() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.74fr_1fr]">
      <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 sm:p-6">
        <p className="section-kicker text-[0.62rem] uppercase tracking-[0.16em] text-sangria">
          Who can apply
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold uppercase leading-tight text-midnightbrown">
          Serious sellers only.
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {applicantTypes.map((type) => (
            <div
              key={type}
              className="rounded-[18px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-midnightbrown"
            >
              {type}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-stone">
          Application intake only. No automatic approval.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {benefits.map((benefit) => (
          <Card
            key={benefit.title}
            className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4"
          >
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-sangria">
              Benefit
            </p>
            <h3 className="mt-3 line-clamp-2 break-words text-base font-bold uppercase leading-tight text-midnightbrown">
              {benefit.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone">
              {benefit.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
