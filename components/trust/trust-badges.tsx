const trustItems = [
  {
    title: "Checkout planned",
    description: "Demo checkout exists now; live payment processing is not connected yet.",
  },
  {
    title: "Seller review planned",
    description: "Seller and listing review foundations are prepared before public launch.",
  },
  {
    title: "Support foundation",
    description: "Support intake is currently MVP/demo and ready for operational review.",
  },
  {
    title: "AI Assistant Beta",
    description: "The assistant uses current SKXNZ catalog data and avoids unsupported claims.",
  },
];

export function TrustBadges() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="min-w-0 rounded-[24px] border border-[var(--skxnz-border)] bg-white px-4 py-4 shadow-[0_14px_34px_rgba(58,8,24,0.06)]"
        >
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-teal">
            Beta-safe trust
          </p>
          <h2 className="mt-2 line-clamp-2 font-display text-lg uppercase tracking-[0.08em] text-sangria">
            {item.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-midnightbrown/66">
            {item.description}
          </p>
        </div>
      ))}
    </section>
  );
}
