import { DataTable } from "@/components/sections/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { demoAdminAnalyticsCards } from "@/lib/data/admin";

const demoSearchQueries = [
  ["chrome jacket", "182", "Product discovery"],
  ["limited edition", "146", "Collection route"],
  ["perfume", "118", "Category route"],
  ["ai styled", "94", "Beta label"],
  ["streetwear", "89", "Category route"],
];

export function AdminAnalyticsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {demoAdminAnalyticsCards.map((metric) => (
          <StatCard
            key={metric.label}
            name={metric.label}
            value={metric.value}
            trend={metric.trend}
            description={metric.description}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Demo Chart
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            Engagement signal preview
          </h2>
          <div className="mt-6 space-y-4">
            {[
              ["Visits", "82%"],
              ["Product views", "68%"],
              ["Searches", "54%"],
              ["Community saves", "36%"],
            ].map(([label, width]) => (
              <div key={label}>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-silver">
                  <span>{label}</span>
                  <span>{width}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--skxnz-glint),var(--skxnz-iris))]"
                    style={{ width }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-silver">
            These bars are visual placeholders. No external analytics package is
            connected in this MVP.
          </p>
        </Card>

        <DataTable
          eyebrow="Search Analytics Demo"
          title="Top query placeholders"
          description="Search query analytics are demo-only until a privacy-safe analytics pipeline is selected."
          columns={["Query", "Count", "Route Intent"]}
          rows={demoSearchQueries.map(([query, count, intent]) => ({
            id: query,
            cells: [query, count, intent],
          }))}
        />
      </div>
    </div>
  );
}
