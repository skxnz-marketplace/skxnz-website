import { Card } from "@/components/ui/card";

type AdminMetricCardProps = {
  name: string;
  value: string;
  trend: string;
  description: string;
};

export function AdminMetricCard({
  name,
  value,
  trend,
  description,
}: AdminMetricCardProps) {
  return (
    <Card className="section-border flex h-full flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-silver">
            {name}
          </p>
          <p className="mt-3 font-display text-3xl uppercase tracking-[0.12em] text-pearl">
            {value}
          </p>
        </div>
        <span className="rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[0.66rem] uppercase tracking-[0.22em] text-teal">
          {trend}
        </span>
      </div>
      <p className="text-sm leading-6 text-silver">{description}</p>
    </Card>
  );
}
