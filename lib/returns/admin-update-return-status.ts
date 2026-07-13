"use server";

// SKXNZ admin return-status transition action (D1-B, hardened D4-A).
//
// Conservative transitions only. REFUND_PENDING / REFUNDED / PICKUP_PENDING /
// RECEIVED / CLOSED are NOT reachable from here — no refund provider or
// pickup system is wired, so this action cannot claim them:
//   REQUESTED -> IN_REVIEW | REJECTED
//   IN_REVIEW -> APPROVED  | REJECTED
//   everything else -> terminal here
//
// Why service-role for the write: authenticated has no UPDATE grant on
// return_requests (0005) — the buyer insert/select policies are the only
// non-admin surface. The caller is verified ADMIN via public.users.role
// (session client) before the service-role write, and every success writes
// an order_events audit row.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

const MAX_NOTE_LENGTH = 500;

const TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["APPROVED", "REJECTED"],
};

export type AdminReturnActionResult =
  | { ok: true; requestId: string; status: string }
  | {
      ok: false;
      code:
        | "VALIDATION_FAILED"
        | "FORBIDDEN"
        | "REQUEST_NOT_FOUND"
        | "INVALID_TRANSITION"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function adminUpdateReturnStatus(input: {
  requestId: string;
  nextStatus: string;
  note?: string | null;
}): Promise<AdminReturnActionResult> {
  if (
    !input ||
    typeof input.requestId !== "string" ||
    typeof input.nextStatus !== "string"
  ) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid request." };
  }
  if (!isOrderIdShape(input.requestId)) {
    return {
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "That return request could not be found.",
    };
  }
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }

  if ((await getCurrentUserRole()) !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only administrators can update return status.",
    };
  }

  const db = await createClient();
  const { data: current, error: readError } = await db
    .from("return_requests")
    .select("id, order_id, status")
    .eq("id", input.requestId)
    .maybeSingle();

  if (readError) {
    if (isMissingTableError(readError)) {
      return {
        ok: false,
        code: "NOT_WIRED",
        message: "The returns database is not connected in this environment.",
      };
    }
    console.warn("[admin-returns] read failed:", readError.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The return request could not be read right now.",
    };
  }
  if (!current) {
    return {
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "That return request could not be found.",
    };
  }
  if (!TRANSITIONS[current.status]?.includes(input.nextStatus)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `A return cannot move from ${current.status} to ${input.nextStatus} here. Refund and pickup states are set only by real provider flows.`,
    };
  }

  const {
    data: { user },
  } = await db.auth.getUser();

  // Conditional update: a concurrent transition conflicts instead of being
  // silently overwritten (0 rows updated = INVALID_TRANSITION).
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("return_requests")
    .update({ status: input.nextStatus })
    .eq("id", input.requestId)
    .eq("status", current.status)
    .select("id, status");

  if (updateError) {
    console.warn("[admin-returns] update failed:", updateError.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The return status could not be updated right now.",
    };
  }
  if (!updated?.length) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: "The return changed while you were updating it. Reload and retry.",
    };
  }

  const { error: eventError } = await supabaseAdmin.from("order_events").insert({
    order_id: current.order_id,
    event_type: "RETURN_STATUS_UPDATED",
    message: note
      ? `Return request moved ${current.status} -> ${input.nextStatus} by admin: ${note}`
      : `Return request moved ${current.status} -> ${input.nextStatus} by admin.`,
    metadata: {
      source: "admin-update-return-status",
      return_request_id: current.id,
      from_status: current.status,
      to_status: input.nextStatus,
      actor_user_id: user?.id ?? null,
    },
  });
  if (eventError) {
    console.warn("[admin-returns] audit event insert failed:", eventError.message);
  }

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${input.requestId}`);
  return { ok: true, requestId: current.id, status: input.nextStatus };
}
