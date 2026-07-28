// CLIENT-SAFE — pure constants, types, and label helpers for the seller
// per-line fulfilment ladder. Deliberately has NO imports: client components
// need this vocabulary, and pulling it from read-seller-orders.ts dragged
// `next/headers` (via lib/supabase/server.ts) into the client graph.
//
// The ladder itself remains enforced server-side in
// lib/orders/seller-update-line-fulfilment.ts and the 0009 RPC. These values
// only describe the UI state; they are never an authority for a mutation.

export type SellerLineFulfilmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PACKED"
  | "HANDED_TO_DELIVERY";

export function describeSellerFulfilment(
  status: SellerLineFulfilmentStatus,
): { label: string; note: string } {
  switch (status) {
    case "PENDING":
      return {
        label: "Awaiting action",
        note: "Buyer has paid. Accept the line to start preparing it.",
      };
    case "ACCEPTED":
      return {
        label: "Accepted — preparing",
        note: "You have accepted the line. Prepare and pack it next.",
      };
    case "PACKED":
      return {
        label: "Packed",
        note: "Packed and ready for hand-off to the delivery partner.",
      };
    case "HANDED_TO_DELIVERY":
      return {
        label: "Handed to delivery",
        note: "You have handed the parcel to a delivery partner.",
      };
  }
}

export const NEXT_SELLER_FULFILMENT: Record<
  SellerLineFulfilmentStatus,
  SellerLineFulfilmentStatus | null
> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PACKED",
  PACKED: "HANDED_TO_DELIVERY",
  HANDED_TO_DELIVERY: null,
};
