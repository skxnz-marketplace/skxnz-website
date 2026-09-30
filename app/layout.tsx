import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/syne/400.css";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/unbounded/200.css";
import "@fontsource/space-grotesk/700.css";

import { Analytics } from "@vercel/analytics/next";
import { ConsentManager } from "@/components/consent/consent-manager";
import { GoogleAnalytics } from "@/components/consent/google-analytics";
import { DemoRoleProvider } from "@/components/auth/demo-role-provider";
import { MarketplaceProvider } from "@/components/marketplace/marketplace-provider";
import { PageShell } from "@/components/layout/page-shell";
import { SiteOpeningLoader } from "@/components/shared/site-opening-loader";
import "@/app/globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://skxnz.com";

// Site-wide structured data — rendered once here, not repeated per page.
// Only confirmed facts: real domain, real logo asset, real Instagram handle,
// and the /shop?q= search that actually filters the live catalog.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SKXNZ",
  url: siteUrl,
  logo: new URL("/assets/brand/marks/skxnz-mark-transparent.png", siteUrl).toString(),
  sameAs: ["https://instagram.com/skxnzofficial"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SKXNZ",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

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
    apple: "/apple-touch-icon.png",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SiteOpeningLoader />
        <DemoRoleProvider>
          <MarketplaceProvider>
            <PageShell>{children}</PageShell>
          </MarketplaceProvider>
        </DemoRoleProvider>
        <ConsentManager />
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
