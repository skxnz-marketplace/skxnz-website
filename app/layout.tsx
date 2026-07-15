import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/syne/400.css";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";

import { DemoRoleProvider } from "@/components/auth/demo-role-provider";
import { MarketplaceProvider } from "@/components/marketplace/marketplace-provider";
import { PageShell } from "@/components/layout/page-shell";
import { SiteOpeningLoader } from "@/components/shared/site-opening-loader";
import "@/app/globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://skxnz.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SKXNZ | WEAR THE SIGNAL",
    template: "%s | SKXNZ",
  },
  description:
    "Private-preview futurewear marketplace by Vivaan Poddar Companies. Explore curated discovery while payments, delivery, and refunds remain unavailable.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "SKXNZ",
    title: "SKXNZ | WEAR THE SIGNAL",
    description:
      "Private-preview futurewear discovery by Vivaan Poddar Companies.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "SKXNZ | WEAR THE SIGNAL",
    description:
      "Private-preview futurewear discovery by Vivaan Poddar Companies.",
  },
  icons: {
    icon: "/assets/brand/marks/skxnz-mark-transparent.png",
    shortcut: "/assets/brand/marks/skxnz-mark-transparent.png",
    apple: "/assets/brand/marks/skxnz-mark-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-warmivory font-sans text-midnightbrown antialiased"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('skxnz_intro_seen')==='true'){document.body.dataset.skxnzIntroSeen='true'}}catch(e){}",
          }}
        />
        <SiteOpeningLoader />
        <DemoRoleProvider>
          <MarketplaceProvider>
            <PageShell>{children}</PageShell>
          </MarketplaceProvider>
        </DemoRoleProvider>
      </body>
    </html>
  );
}
