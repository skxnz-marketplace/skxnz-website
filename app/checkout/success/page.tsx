import type { Metadata } from "next";

import { DemoCheckoutSuccess } from "@/components/checkout/demo-checkout-success";

export const metadata: Metadata = {
  title: "Internal Test Order | SKXNZ",
  description:
    "SKXNZ internal demo checkout success state. No live payment was processed.",
};

export default function CheckoutSuccessPage() {
  return <DemoCheckoutSuccess />;
}

