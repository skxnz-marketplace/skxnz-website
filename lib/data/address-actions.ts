"use server";

// Server-authoritative buyer address actions (D5-2).
//
// Writes to public.addresses (0001_user_layer.sql), which is already live with
// RLS ("addresses: owner can select/insert/update/delete"). This is the SAME
// table createOrderIntent + getBuyerAddresses read, so an address added here is
// immediately usable at checkout — closing the old gap where the account book
// wrote device-local demo data that checkout could never see.
//
// - user_id is ALWAYS derived from supabase.auth.getUser() — never from client.
// - RLS is the enforced boundary; the user_id filter is defensive.
// - No service_role anywhere (session client only).

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AddressActionInput = {
  label?: string;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type AddressActionResult =
  | { ok: true; addressId?: string }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "NOT_WIRED"
        | "NOT_FOUND"
        | "DB_ERROR";
      message: string;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

/** India-ready, deliberately simple validation. Returns a normalised payload
 * (snake_case for the DB) or a single user-facing error message. */
function validateAddressInput(
  input: AddressActionInput,
): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  const fullName = (input.fullName ?? "").trim();
  const phone = (input.phoneNumber ?? "").trim();
  const line1 = (input.line1 ?? "").trim();
  const city = (input.city ?? "").trim();
  const state = (input.state ?? "").trim();
  const postalCode = (input.postalCode ?? "").trim();
  const country = (input.country ?? "").trim() || "India";
  const line2 = (input.line2 ?? "").trim();
  const label = (input.label ?? "").trim() || "Home";

  if (!fullName || fullName.length > 120) {
    return { ok: false, message: "Enter the full name for this address." };
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return { ok: false, message: "Enter a valid phone number (7–15 digits)." };
  }
  if (!line1 || line1.length > 200) {
    return { ok: false, message: "Enter address line 1." };
  }
  if (!city || city.length > 80) {
    return { ok: false, message: "Enter the city." };
  }
  if (!state || state.length > 80) {
    return { ok: false, message: "Enter the state." };
  }
  const pinDigits = postalCode.replace(/\D/g, "");
  if (pinDigits.length < 4 || pinDigits.length > 10) {
    return { ok: false, message: "Enter a valid pincode." };
  }

  return {
    ok: true,
    value: {
      label,
      full_name: fullName,
      phone_number: phone,
      line1,
      line2: line2 || null,
      city,
      state,
      postal_code: postalCode,
      country,
    },
  };
}

/** Clears is_default on all of the buyer's OTHER addresses. */
async function clearOtherDefaults(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exceptId?: string,
) {
  let query = supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  await query;
}

export async function createAddress(
  input: AddressActionInput,
): Promise<AddressActionResult> {
  const validation = validateAddressInput(input);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", message: validation.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to save an address." };
  }

  // First address is always default; otherwise honour the checkbox.
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const shouldBeDefault = input.isDefault || (count ?? 0) === 0;

  if (shouldBeDefault) {
    await clearOtherDefaults(supabase, user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...validation.value, user_id: user.id, is_default: shouldBeDefault })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, code: "NOT_WIRED", message: "Address storage is not connected yet." };
    }
    console.warn("[addresses] create failed:", error.message);
    return { ok: false, code: "DB_ERROR", message: "Could not save this address. Please try again." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, addressId: data.id };
}

export async function updateAddress(
  addressId: string,
  input: AddressActionInput,
): Promise<AddressActionResult> {
  const id = (addressId ?? "").trim();
  if (!id) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Missing address id." };
  }
  const validation = validateAddressInput(input);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", message: validation.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to edit an address." };
  }

  if (input.isDefault) {
    await clearOtherDefaults(supabase, user.id, id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({ ...validation.value, is_default: input.isDefault })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, code: "NOT_WIRED", message: "Address storage is not connected yet." };
    }
    console.warn("[addresses] update failed:", error.message);
    return { ok: false, code: "DB_ERROR", message: "Could not update this address. Please try again." };
  }
  if (!data) {
    return { ok: false, code: "NOT_FOUND", message: "That address could not be found." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, addressId: data.id };
}

export async function deleteAddress(addressId: string): Promise<AddressActionResult> {
  const id = (addressId ?? "").trim();
  if (!id) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Missing address id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to manage addresses." };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, code: "NOT_WIRED", message: "Address storage is not connected yet." };
    }
    console.warn("[addresses] delete failed:", error.message);
    return { ok: false, code: "DB_ERROR", message: "Could not remove this address. Please try again." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function setDefaultAddress(addressId: string): Promise<AddressActionResult> {
  const id = (addressId ?? "").trim();
  if (!id) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Missing address id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to manage addresses." };
  }

  await clearOtherDefaults(supabase, user.id, id);

  const { data, error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, code: "NOT_WIRED", message: "Address storage is not connected yet." };
    }
    console.warn("[addresses] set default failed:", error.message);
    return { ok: false, code: "DB_ERROR", message: "Could not update the default address." };
  }
  if (!data) {
    return { ok: false, code: "NOT_FOUND", message: "That address could not be found." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, addressId: data.id };
}
