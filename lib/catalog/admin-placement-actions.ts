"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";
import { isUuidShape } from "@/lib/saved/saved-items";

type AdminActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "RATE_LIMITED" | "DB_ERROR";
      message: string;
    };

function dbError(): AdminActionResult {
  return { ok: false, code: "DB_ERROR", message: "That didn't go through. Please try again." };
}

/** Same belt-and-braces pattern as lib/community/admin-community-actions.ts:
 * public.products_enforce_admin_only_placement (0018) is the REAL gate —
 * a non-admin write to these columns is silently reverted by that trigger
 * regardless of this check. This just fails fast with a clear message
 * instead of a silent no-op. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, forbidden: false };
  }

  const { data: role, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return { supabase, user, forbidden: true };
  }

  return { supabase, user, forbidden: role?.role !== "ADMIN" };
}

async function updateProductPlacement(
  productId: string,
  patch: Record<string, unknown>,
): Promise<AdminActionResult> {
  if (!isUuidShape(productId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid product." };
  }

  const { supabase, user, forbidden } = await requireAdmin();
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (forbidden) return { ok: false, code: "FORBIDDEN", message: "Only administrators can change product placement." };

  const limit = await guardServerAction("admin.mutation", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { error } = await supabase.from("products").update(patch).eq("id", productId);
  if (error) return dbError();

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}

export async function adminSetProductFeatured(productId: string, isFeatured: boolean): Promise<AdminActionResult> {
  return updateProductPlacement(productId, { is_featured: isFeatured });
}

export async function adminSetProductLimited(productId: string, isLimited: boolean): Promise<AdminActionResult> {
  return updateProductPlacement(productId, { is_limited: isLimited });
}

/** null removes the product from manual Trending Now curation (falls back
 * to the existing newest-first behaviour for the rest of the section). */
export async function adminSetTrendingOrder(productId: string, order: number | null): Promise<AdminActionResult> {
  if (order !== null && (!Number.isInteger(order) || order < 0)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Order must be a non-negative whole number." };
  }
  return updateProductPlacement(productId, { trending_sort_order: order });
}
