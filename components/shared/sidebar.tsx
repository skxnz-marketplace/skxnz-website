import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type SidebarLink = {
  href: string;
  label: string;
  description: string;
};

type SidebarProps = {
  title: string;
  items: SidebarLink[];
  activeHref?: string;
};

export function Sidebar({ title, items, activeHref }: SidebarProps) {
  return (
    <Card className="section-border self-start rounded-[24px] p-3 sm:p-4 xl:sticky xl:top-24">
      <p className="px-2 text-[0.62rem] uppercase tracking-[0.12em] text-teal">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "min-w-0 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-3 transition",
                isActive
                  ? "border-teal/35 bg-teal/10"
                  : "hover:border-teal/25 hover:bg-white/[0.05]",
              )}
            >
              <p className="line-clamp-1 min-w-0 break-words text-xs font-bold uppercase tracking-[0.08em] text-pearl">
                {item.label}
              </p>
              <p className="mt-1 line-clamp-1 text-wrap-safe text-xs leading-5 text-silver">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
