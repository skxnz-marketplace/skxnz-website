import { featureItems } from "@/lib/data/site-content";

export function FeatureStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {featureItems.map((feature, index) => (
          <div
            key={feature.title}
            className="section-border glass-panel rounded-[24px] p-5"
          >
            <div className="mb-4 text-[0.68rem] uppercase tracking-[0.28em] text-teal">
              0{index + 1}
            </div>
            <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-pearl">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-silver">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
