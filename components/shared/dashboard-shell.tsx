import type { ReactNode } from "react";

import { PageIntro } from "@/components/sections/page-intro";
import { Sidebar, type SidebarLink } from "@/components/shared/sidebar";

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  sidebarTitle: string;
  sidebarLinks: SidebarLink[];
  activeHref: string;
  children: ReactNode;
};

export function DashboardShell({
  eyebrow,
  title,
  description,
  actions,
  sidebarTitle,
  sidebarLinks,
  activeHref,
  children,
}: DashboardShellProps) {
  const showAdminSafetyNotice = activeHref === "/admin" || activeHref.startsWith("/admin/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />

      {showAdminSafetyNotice ? (
        <div className="mt-4 rounded-[22px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.07)] p-4 text-sm leading-6 text-[var(--skxnz-text-dark)] shadow-[0_12px_30px_rgba(58,8,24,0.05)]">
          <span className="font-bold uppercase tracking-[0.16em] text-[var(--skxnz-maroon)]">
            Admin Beta:
          </span>{" "}
          Admin back office is an internal foundation. Production role-based access
          must be added before public launch.
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar
          title={sidebarTitle}
          items={sidebarLinks}
          activeHref={activeHref}
        />
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
}
