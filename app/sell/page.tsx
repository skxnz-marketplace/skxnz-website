import { SellerApplicationForm } from "@/components/seller/seller-application-form";
import { SellerApplicationHero } from "@/components/seller/seller-application-hero";
import { SellerBenefits } from "@/components/seller/seller-benefits";
import { Card } from "@/components/ui/card";

const reviewNotes = [
  "SKXNZ reviews brand fit, product quality, category relevance, and operating readiness.",
  "Verification documents are not uploaded or stored in this beta form.",
  "Seller dashboard, live listings, payouts, and product publishing come later.",
];

export default function SellPage() {
  return (
    <div className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <SellerApplicationHero />
        <SellerBenefits />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <SellerApplicationForm />

          <aside className="space-y-6">
            <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
              <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
                Application review
              </p>
              <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
                Internal review only.
              </h2>
              <div className="mt-5 grid gap-3">
                {reviewNotes.map((note) => (
                  <div
                    key={note}
                    className="rounded-[22px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 text-sm leading-7 text-stone"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-7">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[rgba(255,254,250,0.68)]">
                Beta-safe status
              </p>
              <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em]">
                No instant approval.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.78)]">
                Seller application beta. Real seller verification, secure
                document collection, seller login, payouts, and live publishing
                are not connected yet.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
