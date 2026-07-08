// SERVER ONLY — buyer saved-address read for checkout (D4-8).
//
// createOrderIntent needs a real public.addresses row id (it re-fetches the
// address server-side and builds the order's contact/shipping snapshot from
// it — the device-local typed checkout draft is never trusted as the order
// address). This helper lists the authenticated buyer's OWN saved addresses
// so the checkout UI can offer them for selection. RLS ("addresses: owner
// can select") is the real gate; the buyer_id filter is defensive.

import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types/skxnz-data";

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

export type AddressBookResult =
  | { backendReady: true; authenticated: boolean; addresses: Address[] }
  | { backendReady: false; authenticated: boolean; addresses: [] };

/** Full-field read of the buyer's own addresses for the account address book
 * (needs full_name/phone/state etc. for editing). Same table + RLS as the
 * checkout read. `authenticated` is false when signed out; `backendReady` is
 * false only if public.addresses is missing (never, once 0001 is applied). */
export async function getBuyerAddressBook(): Promise<AddressBookResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, authenticated: false, addresses: [] };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select(
      "id, user_id, label, full_name, phone_number, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, authenticated: true, addresses: [] };
    }
    console.warn("[account] address book read failed:", error.message);
    return { backendReady: true, authenticated: true, addresses: [] };
  }

  return {
    backendReady: true,
    authenticated: true,
    addresses: (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      label: row.label,
      fullName: row.full_name ?? "",
      phoneNumber: row.phone_number ?? "",
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code ?? "",
      country: row.country,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}
