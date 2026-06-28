import type { ReactNode } from "react";

import { FloatingSkxnzAssistant } from "@/components/ai/floating-skxnz-assistant";
import { MockNotice } from "@/components/layout/mock-notice";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="page-frame flex min-h-screen flex-col">
      <MockNotice />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingSkxnzAssistant />
    </div>
  );
}
