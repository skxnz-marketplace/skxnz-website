"use server";

// SKXNZ admin support actions (D1-B, hardened D4-A).
//
// adminUpdateSupportTicketStatus — validated transitions only:
//   OPEN                 -> IN_REVIEW | WAITING_FOR_CUSTOMER | RESOLVED | CLOSED
//   IN_REVIEW            -> WAITING_FOR_CUSTOMER | RESOLVED | CLOSED
//   WAITING_FOR_CUSTOMER -> IN_REVIEW | RESOLVED | CLOSED
//   RESOLVED             -> CLOSED
//   CLOSED               -> terminal
//
// adminAddSupportReply — inserts one support_ticket_messages row with
// sender_role 'ADMIN' and sender_id taken from the AUTHENTICATED session,
// never from client input (attribution is server-controlled). Buyers cannot
// forge this path: the RLS buyer insert policy only allows sender_role
// 'BUYER' with sender_id = auth.uid(), and this action verifies ADMIN via
// public.users.role before the service-role write.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

const MAX_MESSAGE_LENGTH = 4000;

const TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_REVIEW", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"],
  IN_REVIEW: ["WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"],
  WAITING_FOR_CUSTOMER: ["IN_REVIEW", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export type AdminSupportActionResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "VALIDATION_FAILED"
        | "FORBIDDEN"
        | "TICKET_NOT_FOUND"
        | "INVALID_TRANSITION"
        | "NOT_ALLOWED"
        | "DB_ERROR";
      message: string;
    };

export async function adminUpdateSupportTicketStatus(input: {
  ticketId: string;
  nextStatus: string;
}): Promise<AdminSupportActionResult> {
  if (
    !input ||
    typeof input.ticketId !== "string" ||
    typeof input.nextStatus !== "string"
  ) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid request." };
  }
  if (!isOrderIdShape(input.ticketId)) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That ticket could not be found.",
    };
  }
  if ((await getCurrentUserRole()) !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only administrators can update ticket status.",
    };
  }

  const db = await createClient();
  const { data: current, error: readError } = await db
    .from("support_tickets")
    .select("id, status")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (readError) {
    console.warn("[admin-support] ticket read failed:", readError.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The ticket could not be read right now.",
    };
  }
  if (!current) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That ticket could not be found.",
    };
  }
  if (!TRANSITIONS[current.status]?.includes(input.nextStatus)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `A ticket cannot move from ${current.status} to ${input.nextStatus}.`,
    };
  }

  // Conditional update — concurrent transition conflicts instead of being
  // silently overwritten.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("support_tickets")
    .update({ status: input.nextStatus })
    .eq("id", input.ticketId)
    .eq("status", current.status)
    .select("id");
  if (updateError) {
    console.warn("[admin-support] status update failed:", updateError.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The ticket status could not be updated right now.",
    };
  }
  if (!updated?.length) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: "The ticket changed while you were updating it. Reload and retry.",
    };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${input.ticketId}`);
  return { ok: true };
}

export async function adminAddSupportReply(input: {
  ticketId: string;
  message: string;
}): Promise<AdminSupportActionResult> {
  if (
    !input ||
    typeof input.ticketId !== "string" ||
    typeof input.message !== "string" ||
    !input.message.trim() ||
    input.message.length > MAX_MESSAGE_LENGTH
  ) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid reply." };
  }
  if (!isOrderIdShape(input.ticketId)) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That ticket could not be found.",
    };
  }
  if ((await getCurrentUserRole()) !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only administrators can reply here.",
    };
  }

  const db = await createClient();
  const { data: ticket, error: readError } = await db
    .from("support_tickets")
    .select("id, status")
    .eq("id", input.ticketId)
    .maybeSingle();
  if (readError) {
    console.warn("[admin-support] ticket read failed:", readError.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The ticket could not be read right now.",
    };
  }
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!ticket || !user) {
    return {
      ok: false,
      code: "TICKET_NOT_FOUND",
      message: "That ticket could not be found.",
    };
  }
  if (ticket.status === "CLOSED") {
    return {
      ok: false,
      code: "NOT_ALLOWED",
      message: "This ticket is closed. Reopen paths are not supported — the buyer can open a new ticket.",
    };
  }

  // sender_id comes from the verified session — never from input.
  const { error } = await supabaseAdmin.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    sender_role: "ADMIN",
    message: input.message.trim(),
  });
  if (error) {
    console.warn("[admin-support] reply insert failed:", error.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "The reply could not be sent right now.",
    };
  }

  revalidatePath(`/admin/support/${input.ticketId}`);
  return { ok: true };
}
