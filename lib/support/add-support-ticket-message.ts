"use server";

import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";

const MAX_MESSAGE_LENGTH = 4000;

export type AddSupportTicketMessageInput = {
  ticketId: string;
  message: string;
  idempotencyKey?: string | null;
};

export type AddSupportTicketMessageResult =
  | { ok: true; messageId: string }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "RATE_LIMITED"
        | "VALIDATION_FAILED"
        | "TICKET_NOT_FOUND"
        | "TICKET_NOT_ACTIVE"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): AddSupportTicketMessageResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Support tickets are not connected yet. The atomic support database migration has not been applied, so no reply was saved.",
  };
}

function dbError(): AddSupportTicketMessageResult {
  return { ok: false, code: "DB_ERROR", message: "We could not send your reply right now. Please try again." };
}

export async function addSupportTicketMessage(input: AddSupportTicketMessageInput): Promise<AddSupportTicketMessageResult> {
  const message = input.message?.trim() ?? "";
  if (!message) return { ok: false, code: "VALIDATION_FAILED", message: "A reply message is required." };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, code: "VALIDATION_FAILED", message: `Replies must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }
  if (!input.ticketId || !isOrderIdShape(input.ticketId)) {
    return { ok: false, code: "TICKET_NOT_FOUND", message: "That support ticket could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to reply to support." };

  // Abuse control: per-verified-session, before any write.
  const limit = await guardServerAction("support.reply", { userId: user.id });
  if (!limit.ok) {
    return limit.error;
  }

  const { data, error } = await supabase.rpc("add_support_ticket_message_idempotent", {
    p_ticket_id: input.ticketId,
    p_message: message,
    p_sender_role: "BUYER",
    p_idempotency_key: input.idempotencyKey ?? crypto.randomUUID(),
  });

  if (error) {
    if (isMissingTableError(error) || error.code === "42883" || error.code === "PGRST202") return notWired();
    console.warn("[support] atomic reply RPC failed:", error.message);
    return dbError();
  }
  const row = data as { ok?: boolean; code?: string; message_id?: string } | null;
  if (row?.ok === true && typeof row.message_id === "string") return { ok: true, messageId: row.message_id };
  if (row?.code === "TICKET_NOT_ACTIVE") {
    return {
      ok: false,
      code: "TICKET_NOT_ACTIVE",
      message: "This ticket is closed. Please open a new support ticket if you still need help.",
    };
  }
  if (row?.code === "TICKET_NOT_FOUND") {
    return { ok: false, code: "TICKET_NOT_FOUND", message: "That support ticket could not be found." };
  }
  if (row?.code === "VALIDATION_FAILED" || row?.code === "IDEMPOTENCY_CONFLICT") {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid support reply." };
  }
  return dbError();
}
