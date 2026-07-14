import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

// Honest future-capability panel. Draft creation is handled separately; these
// entries never imply payment, fulfilment, or a delivery date.
const nextSteps = [
  {
    step: "01",
    title: "Secure payment connection",
    description:
      "Payment provider integration is planned server-side. It is not connected or charge-capable yet.",
  },
  {
    step: "02",
    title: "Paid order confirmation",
    description:
      "An unpaid draft is available today. A paid confirmation will appear only after a future server-verified payment. Not active yet.",
  },
  {
    step: "03",
    title: "Delivery partner assignment",
    description:
      "A shipping partner can be assigned only after a paid order enters fulfilment. No tracking or delivery date is promised today.",
  },
] as const;

export function CheckoutNextSteps({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8",
        className,
      )}
    >
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        What happens next
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        After the unpaid draft.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
        These capabilities are still upcoming. Creating a draft today does not
        activate payment, shipping, tracking, or delivery.
      </p>

      <ol className="mt-6 space-y-4">
        {nextSteps.map((item) => (
          <li
            key={item.step}
            className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-4 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-surface)] font-display text-sm tracking-[0.1em] text-sangria"
            >
              {item.step}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-bold uppercase tracking-[0.12em] text-midnightbrown">
                  {item.title}
                </p>
                <span className="rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-surface)] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-stone">
                  Upcoming
                </span>
              </div>
              <p className="mt-1.5 break-words text-sm leading-6 text-stone">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
