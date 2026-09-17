"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// The assistant does not render during SSR (it waits for its mount effect), so
// loading it after shell hydration keeps first paint identical while removing
// its closed-state code from every buyer route's initial client chunk.
const FloatingSkxnzAssistant = dynamic(
  () =>
    import("@/components/ai/floating-skxnz-assistant").then(
      (module) => module.FloatingSkxnzAssistant,
    ),
  { ssr: false },
);

// On a phone the floating button sits over form fields and the primary CTA in
// the cart, checkout and sign-in flows, where it is least useful. Larger
// screens keep it.
const COMMERCE_FLOW = ["/cart", "/checkout", "/login", "/signup", "/forgot-password", "/reset-password"];

export function FloatingSkxnzAssistantLoader() {
  const pathname = usePathname();
  const inCommerceFlow = COMMERCE_FLOW.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <div className={inCommerceFlow ? "hidden md:contents" : "contents"}>
      <FloatingSkxnzAssistant />
    </div>
  );
}
