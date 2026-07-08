// SERVER ONLY — buyer saved-address read for checkout (D4-8).
//
// createOrderIntent needs a real public.addresses row id (it re-fetches the
// address server-side and builds the order's contact/shipping snapshot from
// it — the device-local typed checkout draft is never trusted as the order
// address). This helper lists the authenticated buyer's OWN saved addresses
// so the checkout UI can offer them for selection. RLS ("addresses: owner
// can select") is the real gate; the buyer_id filter is defensive.

import { createClient } from "@/lib/supabase/server";

export type BuyerAddressOption = {
  id: string;
  label: string | null;
  fullName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export type BuyerAddressesResult =
  | { backendReady: true; addresses: BuyerAddressOption[] }
  | { backendReady: false; addresses: [] };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

/** The authenticated buyer's saved addresses, default first. Empty when the
 * buyer has none (the checkout UI then points them to add one). */
export async function getBuyerAddresses(): Promise<BuyerAddressesResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, addresses: [] };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select(
      "id, label, full_name, line1, line2, city, state, postal_code, country, is_default",
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, addresses: [] };
    }
    console.warn("[checkout] address lookup failed:", error.message);
    return { backendReady: true, addresses: [] };
  }

  return {
    backendReady: true,
    addresses: (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      fullName: row.full_name,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      isDefault: row.is_default,
    })),
  };
}
