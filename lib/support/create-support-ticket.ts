"use server";

// SKXNZ create-support-ticket server action (D4-5).
//
// Creates one `support_tickets` row (status OPEN) + the opening
// `support_ticket_messages` row (sender_role BUYER) for the authenticated
// buyer, against the 0005 commerce schema.
//
// Security:
//   - buyer_id is session-derived (NEVER client input).
//   - If orderId is provided, the order is re-fetched and must belong to the
//     session buyer — cross-buyer ticket linking is rejected here AND by the
//     RLS insert policy ("support_tickets: buyer can insert own").
//   - Status starts at 'OPEN' only. Never RESOLVED/CLOSED. No staff reply is
//     ever invented — the only message written is the buyer's own.
//
// Migration status: 0005 finalized, NOT applied live. Missing tables
// (Postgres 42P01) surface as { ok: false, code: "NOT_WIRED" }.
//
// Atomicity limitation: no client-side transaction, so the ticket inserts
// before its opening message. If the message insert fails, the ticket still
// exists with no messages; the action reports DB_ERROR so the buyer retries
// via a reply (addSupportTicketMessage) — no fake state is created either way.

import { createClient } from "@/lib/supabase/server";
import {
  validateSupportTicketInput,
  type CreateSupportTicketInput,
} from "@/lib/support/support-requests";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

export type CreateSupportTicketResult =
  | {
      ok: true;
      ticketId: string;
      status: "OPEN";
      redirectTo: string;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "ORDER_NOT_FOUND"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
      fieldErrors?: Record<string, string>;
    };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): CreateSupportTicketResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Support tickets are not connected yet. The commerce database has not been applied, so no ticket was created.",
  };
}

function dbError(): CreateSupportTicketResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "We could not open your ticket right now. Please try again.",
  };
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<CreateSupportTicketResult> {
  // ---- 1. Shape validation (shared D4-1 validator) ------------------------
  const fieldErrors = validateSupportTicketInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Some ticket details are missing or invalid.",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  // ---- 2. Authenticated buyer ---------------------------------------------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to contact support.",
    };
  }

  // ---- 3. Optional order link must be the buyer's OWN order ---------------
  let linkedOrderId: string | null = null;
  if (input.orderId) {
    if (!isOrderIdShape(input.orderId)) {
      return {
        ok: false,
        code: "ORDER_NOT_FOUND",
        message: "That order could not be found.",
      };
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id")
      .eq("id", input.orderId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (orderError) {
      if (isMissingTableError(orderError)) return notWired();
      console.warn("[support] order lookup failed:", orderError.message);
      return dbError();
    }
    if (!order) {
      return {
        ok: false,
        code: "ORDER_NOT_FOUND",
        message: "That order could not be found.",
      };
    }
    linkedOrderId = order.id;
  }

  // ---- 4. Insert support_tickets (status OPEN — the only honest start) ----
  const { data: ticketRow, error: ticketInsertError } = await supabase
    .from("support_tickets")
    .insert({
      buyer_id: user.id,
      order_id: linkedOrderId,
      category: input.category,
      status: "OPEN",
      subject: input.subject.trim(),
    })
    .select("id")
    .single();

  if (ticketInsertError || !ticketRow) {
    if (isMissingTableError(ticketInsertError)) return notWired();
    console.warn(
      "[support] support_tickets insert failed:",
      ticketInsertError?.message,
    );
    return dbError();
  }
  const ticketId = ticketRow.id as string;

  // ---- 5. Opening buyer message (sender_role BUYER — never staff) ---------
  const { error: messageInsertError } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: "BUYER",
      message: input.message.trim(),
    });

  if (messageInsertError) {
    // Ticket exists without its opening message (no rollback possible from
    // this session). Report the failure honestly so the buyer can retry the
    // message as a reply. See the atomicity note at the top of this file.
    console.warn(
      "[support] opening message insert failed:",
      messageInsertError.message,
    );
    return dbError();
  }

  return {
    ok: true,
    ticketId,
    status: "OPEN",
    redirectTo: "/support",
  };
}
