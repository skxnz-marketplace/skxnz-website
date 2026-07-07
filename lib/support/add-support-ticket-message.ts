"use server";

// SKXNZ add-support-ticket-message server action (D4-5).
//
// Appends ONE buyer reply (sender_role BUYER) to the buyer's OWN ticket.
//
// Security:
//   - buyer identity is session-derived (NEVER client input).
//   - Ticket is re-fetched and must belong to the session buyer.
//   - Replies are allowed only while the ticket is active — status OPEN,
//     WAITING_FOR_CUSTOMER, or IN_REVIEW (mirrors the RLS insert policy
//     "support_ticket_messages: buyer can insert own as buyer"). RESOLVED
//     and CLOSED tickets are not silently reopened; the buyer is told to
//     open a new ticket.
//   - No staff/admin/system message is ever written here.
//
// Migration status: 0005 finalized, NOT applied live. Missing tables
// (Postgres 42P01) surface as { ok: false, code: "NOT_WIRED" }.

import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

const MAX_MESSAGE_LENGTH = 4000;

/** Ticket statuses a buyer may still reply to (matches the RLS policy). */
const REPLYABLE_STATUSES = ["OPEN", "WAITING_FOR_CUSTOMER", "IN_REVIEW"] as const;

export type AddSupportTicketMessageInput = {
  ticketId: string;
  message: string;
};

export type AddSupportTicketMessageResult =
  | {
      ok: true;
      messageId: string;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "TICKET_NOT_FOUND"
        | "TICKET_NOT_ACTIVE"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function addSupportTicketMessage(
  input: AddSupportTicketMessageInput,
): Promise<AddSupportTicketMessageResult> {
  // ---- 1. Shape validation -------------------------------------------------
  const message = input.message?.trim() ?? "";
  if (!message) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "A reply message is required.",
    };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `Replies must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }
  // Ticket ids are uuids like every other 0005 id; same shape check applies.
  if (!input.ticketId || !isOrderIdShape(input.ticketId)) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That support ticket could not be found.",
    };
  }

  const supabase = await createClient();

  // ---- 2. Authenticated buyer ----------------------------------------------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to reply to support.",
    };
  }

  // ---- 3. Ticket must be the buyer's own AND still active -------------------
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, buyer_id, status")
    .eq("id", input.ticketId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (ticketError) {
    if (isMissingTableError(ticketError)) return notWired();
    console.warn("[support] ticket lookup failed:", ticketError.message);
    return dbError();
  }
  if (!ticket) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That support ticket could not be found.",
    };
  }
  if (!REPLYABLE_STATUSES.includes(ticket.status as (typeof REPLYABLE_STATUSES)[number])) {
    return {
      ok: false,
      code: "TICKET_NOT_ACTIVE",
      message:
        "This ticket is closed. Please open a new support ticket if you still need help.",
    };
  }

  // ---- 4. Insert the buyer reply (sender_role BUYER — never staff) ---------
  const { data: messageRow, error: insertError } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: "BUYER",
      message,
    })
    .select("id")
    .single();

  if (insertError || !messageRow) {
    if (isMissingTableError(insertError)) return notWired();
    console.warn("[support] reply insert failed:", insertError?.message);
    return dbError();
  }

  return { ok: true, messageId: messageRow.id as string };
}

function notWired(): AddSupportTicketMessageResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Support tickets are not connected yet. The commerce database has not been applied, so no reply was saved.",
  };
}

function dbError(): AddSupportTicketMessageResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "We could not send your reply right now. Please try again.",
  };
}
