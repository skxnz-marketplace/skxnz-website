"use server";

import { createClient } from "@/lib/supabase/server";
import {
  validateSupportTicketInput,
  type CreateSupportTicketInput,
} from "@/lib/support/support-requests";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";

export type CreateSupportTicketResult =
  | { ok: true; ticketId: string; status: "OPEN"; redirectTo: string }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "VALIDATION_FAILED" | "ORDER_NOT_FOUND" | "RATE_LIMITED" | "NOT_WIRED" | "DB_ERROR";
      message: string;
      fieldErrors?: Record<string, string>;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): CreateSupportTicketResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Support tickets are not connected yet. The atomic support database migration has not been applied, so no ticket was created.",
  };
}

function dbError(): CreateSupportTicketResult {
  return { ok: false, code: "DB_ERROR", message: "We could not open your ticket right now. Please try again." };
}

function mapAtomicError(error: { code?: string; message?: string } | null) {
  if (isMissingTableError(error) || error?.code === "42883" || error?.code === "PGRST202") return notWired();
  console.warn("[support] atomic ticket RPC failed:", error?.message);
  return dbError();
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<CreateSupportTicketResult> {
  const fieldErrors = validateSupportTicketInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Some ticket details are missing or invalid.", fieldErrors };
  }
  if (input.orderId && !isOrderIdShape(input.orderId)) {
    return { ok: false, code: "ORDER_NOT_FOUND", message: "That order could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to contact support." };
  }

  // Abuse control: counted against the verified session id, before any write.
  const limit = await guardServerAction("support.ticket", { userId: user.id });
  if (!limit.ok) {
    return limit.error;
  }

  const { data, error } = await supabase.rpc("create_support_ticket_idempotent", {
    p_category: input.category,
    p_subject: input.subject.trim(),
    p_message: input.message.trim(),
    p_order_id: input.orderId || null,
    p_idempotency_key: input.idempotencyKey ?? crypto.randomUUID(),
  });

  if (error) return mapAtomicError(error);
  const row = data as { ok?: boolean; code?: string; ticket_id?: string } | null;
  if (row?.ok === true && typeof row.ticket_id === "string") {
    return { ok: true, ticketId: row.ticket_id, status: "OPEN", redirectTo: `/account/support/${row.ticket_id}` };
  }
  if (row?.code === "ORDER_NOT_FOUND") {
    return { ok: false, code: "ORDER_NOT_FOUND", message: "That order could not be found." };
  }
  if (row?.code === "UNAUTHENTICATED") {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to contact support." };
  }
  if (row?.code === "VALIDATION_FAILED" || row?.code === "IDEMPOTENCY_CONFLICT") {
    return { ok: false, code: "VALIDATION_FAILED", message: "Some ticket details are missing or invalid." };
  }
  return dbError();
}
