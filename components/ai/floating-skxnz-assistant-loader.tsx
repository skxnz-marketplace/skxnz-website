"use client";

import dynamic from "next/dynamic";

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

export function FloatingSkxnzAssistantLoader() {
  return <FloatingSkxnzAssistant />;
}
