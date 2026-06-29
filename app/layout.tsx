import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
    default: "SKXNZ | Private MVP Foundation",
    template: "%s | SKXNZ",
  },
  description:
    "Private web MVP foundation for SKXNZ, the AI-powered futurewear marketplace by Vivaan Poddar Companies.",
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
        className={`${spaceGrotesk.variable} bg-warmivory font-sans text-midnightbrown antialiased`}
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
