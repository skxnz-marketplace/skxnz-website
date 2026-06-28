import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type StatusBadgeProps = {
  label: string;
};

const toneMap: Array<{
  match: string[];
  className: string;
}> = [
  {
    match: [
      "approved",
      "delivered",
      "resolved",
      "released",
      "paid",
      "refunded",
      "complete",
      "closed",
      "reviewed",
      "picked up",
    ],
    className: "border-teal/25 bg-teal/10 text-teal",
  },
  {
    match: [
      "pending",
      "placed",
      "queue",
      "awaiting",
      "packed",
      "in progress",
      "confirmed",
      "open",
      "current",
      "not connected",
    ],
    className: "border-sangria/22 bg-sangria/8 text-sangria",
  },
  {
    match: [
      "review hold",
      "needs samples",
      "needs more info",
      "review needed",
      "low stock",
      "draft",
      "rejected",
      "failed",
      "cancelled",
      "escalated",
    ],
    className: "border-sandstone bg-white/70 text-stone",
  },
  {
    match: ["shipped", "scheduled", "transit", "out for delivery", "upcoming"],
    className: "border-wine/20 bg-wine/10 text-sangria",
  },
];

export function StatusBadge({ label }: StatusBadgeProps) {
  const normalizedLabel = label.toLowerCase();
  const matchedTone = toneMap.find((tone) =>
    tone.match.some((keyword) => normalizedLabel.includes(keyword)),
  );

  return (
    <Badge
      className={cn(
        "border-sandstone bg-white/80 text-stone",
        matchedTone?.className,
      )}
    >
      {label}
    </Badge>
  );
}
