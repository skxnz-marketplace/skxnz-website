// Shared, dependency-free seller fulfilment vocabulary.
//
// These live apart from read-seller-orders.ts on purpose: client components
// need the status type, the labels and the transition map, but that module
// imports lib/supabase/server.ts (which uses next/headers). Importing even a
// pure helper from it pulls the server client into the client bundle and fails
// the production build. Nothing here may import server-only code.

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
