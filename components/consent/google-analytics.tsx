"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useConsent } from "@/lib/consent/use-consent";
import { canTrackPage, GA_INIT, GA_MEASUREMENT_ID } from "@/lib/consent/google-analytics";

export function GoogleAnalytics() {
  const { ready, record } = useConsent();
  const granted = ready && record?.categories.analytics === true;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const allowed = canTrackPage(window.location.hostname, granted);
    // Removing script JSX cannot unload gtag. Google's opt-out flag also stops
    // the already-loaded tag after consent is withdrawn.
    (window as typeof window & Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !allowed;
    setEnabled(allowed);
  }, [granted]);

  if (!enabled) return null;
  return <>
    <Script id="ga-init" strategy="afterInteractive">{GA_INIT}</Script>
    <Script id="ga-loader" strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
  </>;
}
