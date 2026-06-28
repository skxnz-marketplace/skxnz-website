import { Card } from "@/components/ui/card";

type MetricCardProps = {
  name: string;
  value: string;
  trend: string;
  description: string;
};

export function MetricCard({
  name,
  value,
  trend,
  description,
}: MetricCardProps) {
  return (
    <Card className="section-border flex h-full flex-col gap-3 rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
            {name}
          </p>
          <p className="mt-2 text-xl font-semibold uppercase tracking-[0.04em] text-midnightbrown sm:text-2xl">
            {value}
          </p>
        </div>
        <span className="rounded-full border border-teal/25 bg-teal/10 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-teal">
          {trend}
        </span>
      </div>
      <p className="line-clamp-2 text-xs leading-5 text-silver">{description}</p>
    </Card>
  );
}
