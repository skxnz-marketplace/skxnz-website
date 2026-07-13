"use server";

// D4-B: application boundary for the draft 0010 atomic ADMIN RPC. There is
// deliberately no service-role update/audit fallback.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape, type BuyerOrderStatus } from "@/lib/orders/read-buyer-orders";
import { ADMIN_ORDER_TRANSITIONS } from "@/lib/orders/admin-order-transitions";

const MAX_NOTE_LENGTH = 500;
export type AdminUpdateOrderStatusInput = { orderId: string; nextStatus: string; note?: string | null };
export type AdminUpdateOrderStatusResult = { ok: true; orderId: string; status: BuyerOrderStatus } | { ok: false; code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "ORDER_NOT_FOUND" | "INVALID_TRANSITION" | "NOT_WIRED" | "DB_ERROR"; message: string };
const notWired = (): AdminUpdateOrderStatusResult => ({ ok: false, code: "NOT_WIRED", message: "Order management is not connected yet. The atomic admin database migration has not been applied, so nothing was changed." });
function rpcError(e: { code?: string; message?: string } | null): AdminUpdateOrderStatusResult {
  const m = e?.message ?? "";
  if (e?.code === "PGRST202" || e?.code === "42883" || /function .* does not exist/i.test(m)) return notWired();
  if (/SKXNZ_UNAUTHENTICATED/.test(m)) return { ok:false, code:"UNAUTHENTICATED", message:"Please sign in." };
  if (/SKXNZ_ADMIN_REQUIRED/.test(m)) return { ok:false, code:"FORBIDDEN", message:"Only administrators can update order status." };
  if (/SKXNZ_ORDER_NOT_FOUND/.test(m)) return { ok:false, code:"ORDER_NOT_FOUND", message:"That order could not be found." };
  if (/SKXNZ_INVALID_TRANSITION/.test(m)) return { ok:false, code:"INVALID_TRANSITION", message:"That transition is not allowed. PAID and REFUNDED are set only by real payment flows." };
  if (/SKXNZ_NOTE_TOO_LONG/.test(m)) return { ok:false, code:"VALIDATION_FAILED", message:`Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  console.warn("[admin-orders] atomic RPC failed:", m); return { ok:false, code:"DB_ERROR", message:"The order status could not be updated right now. Please try again." };
}
export async function adminUpdateOrderStatus(input: AdminUpdateOrderStatusInput): Promise<AdminUpdateOrderStatusResult> {
  if (!input || !isOrderIdShape(input.orderId)) return { ok:false, code:"ORDER_NOT_FOUND", message:"That order could not be found." };
  if (!(input.nextStatus in ADMIN_ORDER_TRANSITIONS)) return { ok:false, code:"VALIDATION_FAILED", message:"That is not a valid order status." };
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > MAX_NOTE_LENGTH) return { ok:false, code:"VALIDATION_FAILED", message:`Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  const db = await createClient(); const { data:{user}, error:userError } = await db.auth.getUser();
  if (userError || !user) return { ok:false, code:"UNAUTHENTICATED", message:"Please sign in." };
  const { data: role, error: roleError } = await db.from("users").select("role").eq("id",user.id).maybeSingle();
  if (roleError) return { ok:false, code:"DB_ERROR", message:"The order status could not be updated right now. Please try again." };
  if (role?.role !== "ADMIN") return { ok:false, code:"FORBIDDEN", message:"Only administrators can update order status." };
  const { data, error } = await db.rpc("admin_update_order_status_atomic", { p_order_id:input.orderId, p_next_status:input.nextStatus, p_note:note || null });
  if (error) return rpcError(error); const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.order_id !== "string" || typeof row.status !== "string") return { ok:false, code:"DB_ERROR", message:"The order status could not be updated right now. Please try again." };
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${row.order_id}`); return { ok:true, orderId:row.order_id, status:row.status as BuyerOrderStatus };
}
