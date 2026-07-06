import { CartPreviewTable } from "@/components/buyer/cart-preview-table";
import { Card } from "@/components/ui/card";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_0.72fr]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Cart
            </p>
            <h1 className="mt-4 max-w-[13ch] break-words font-display text-[2.4rem] uppercase leading-[0.92] tracking-[-0.04em] text-midnightbrown sm:max-w-[16ch] sm:text-5xl lg:text-6xl">
              Your signal edit.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-stone sm:text-base">
              Review your selected SKXNZ pieces, adjust quantities, and continue
              to checkout review.
            </p>
          </div>
          <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,254,250,0.72)]">
              Checkout status
            </p>
            <h2 className="mt-4 max-w-sm break-words font-display text-2xl uppercase leading-tight tracking-[0.04em] sm:text-3xl">
              No live payment is connected.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.78)]">
              Checkout review is available now. Live payment, delivery tracking,
              and refunds are connected in a later step.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <CartPreviewTable />
      </div>
    </div>
  );
}
