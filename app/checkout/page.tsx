import type { Metadata } from "next";

import { CheckoutDraftFlow } from "@/components/checkout/checkout-draft-flow";
import { PlaceDraftOrder } from "@/components/checkout/place-draft-order";
import { getBuyerAddresses } from "@/lib/orders/read-buyer-addresses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout Review | SKXNZ",
  description:
    "SKXNZ checkout review. Prepare contact and shipping details, then save an unpaid draft order before live payment is connected.",
};

export default async function CheckoutPage() {
  // Saved addresses are read server-side; createOrderIntent re-fetches the
  // chosen one again server-side, so the client never supplies order data.
  const { addresses, backendReady } = await getBuyerAddresses();

  return (
    <>
      <CheckoutDraftFlow />
      <div className="mx-auto max-w-[92rem] px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <PlaceDraftOrder addresses={addresses} backendReady={backendReady} />
      </div>
    </>
  );
}
