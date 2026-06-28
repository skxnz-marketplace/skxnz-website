import { Card } from "@/components/ui/card";

type StatCardProps = {
  name: string;
  value: string;
  trend: string;
  description: string;
};

export function StatCard({
  name,
  value,
  trend,
  description,
}: StatCardProps) {
  return (
    <Card className="section-border flex h-full flex-col gap-3 rounded-[22px] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
            {name}
          </p>
          <p className="mt-2 text-wrap-safe break-words text-xl font-semibold uppercase tracking-[0.04em] text-pearl sm:text-2xl">
            {value}
          </p>
        </div>
        <span className="max-w-full rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-teal">
          {trend}
        </span>
      </div>
      <p className="line-clamp-2 text-wrap-safe text-xs leading-5 text-silver">{description}</p>
    </Card>
  );
}
