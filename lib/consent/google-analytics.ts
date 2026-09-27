export const GA_MEASUREMENT_ID = "G-DB3L1WH491";

export function canTrackPage(hostname: string, consent: boolean) {
  return ["skxnz.com", "www.skxnz.com"].includes(hostname) && consent;
}

// Enhanced Measurement owns SPA history page views. No manual page_view
// listener: combining the two would count each navigation twice.
export const GA_INIT = `window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_MEASUREMENT_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false});`;
