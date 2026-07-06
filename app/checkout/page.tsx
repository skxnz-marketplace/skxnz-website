import type { Metadata } from "next";

import { CheckoutDraftFlow } from "@/components/checkout/checkout-draft-flow";

export const metadata: Metadata = {
  title: "Checkout Review | SKXNZ",
  description:
    "SKXNZ checkout review. Prepare contact and shipping details before live payment is connected.",
};

export default function CheckoutPage() {
  return <CheckoutDraftFlow />;
}
