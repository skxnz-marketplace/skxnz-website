import type { Metadata } from "next";

import { DemoCheckoutFlow } from "@/components/checkout/demo-checkout-flow";

export const metadata: Metadata = {
  title: "Demo Checkout | SKXNZ",
  description:
    "Internal SKXNZ demo checkout flow. Payment integration is not live.",
};

export default function CheckoutPage() {
  return <DemoCheckoutFlow />;
}

