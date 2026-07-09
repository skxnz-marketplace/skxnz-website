// SERVER ONLY — buyer support-ticket read (D5-3).
//
// Lists the authenticated buyer's OWN support_tickets (0005 commerce schema).
// RLS ("support_tickets: buyer can select own") is the real gate; the buyer_id
// filter is defensive. backendReady is false only if 0005 is not applied
// (42P01) — the UI then shows an honest "not connected yet" state.

import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";
import type {
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/lib/support/support-requests";

export type BuyerSupportTicket = {
  id: string;
  orderId: string | null;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  subject: string;
  createdAt: string;
};

export type BuyerSupportTicketsResult =
  | { backendReady: true; authenticated: boolean; tickets: BuyerSupportTicket[] }
  | { backendReady: false; authenticated: boolean; tickets: [] };

/** One message in a support-ticket thread. sender_role distinguishes the buyer
 *  from SKXNZ staff/system replies for display. */
export type BuyerSupportTicketMessage = {
  id: string;
  senderRole: "BUYER" | "SUPPORT" | "ADMIN" | "SYSTEM";
  message: string;
  createdAt: string;
};

export type BuyerSupportTicketThread = BuyerSupportTicket & {
  messages: BuyerSupportTicketMessage[];
};

export type BuyerSupportTicketThreadResult =
  | { backendReady: true; authenticated: boolean; found: boolean; thread: BuyerSupportTicketThread | null }
  | { backendReady: false; authenticated: boolean; found: false; thread: null };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function getBuyerSupportTickets(): Promise<BuyerSupportTicketsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, authenticated: false, tickets: [] };
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, order_id, category, status, subject, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, authenticated: true, tickets: [] };
    }
    console.warn("[support] ticket read failed:", error.message);
    return { backendReady: true, authenticated: true, tickets: [] };
  }

  return {
    backendReady: true,
    authenticated: true,
    tickets: (data ?? []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      category: row.category as SupportTicketCategory,
      status: row.status as SupportTicketStatus,
      subject: row.subject,
      createdAt: row.created_at,
    })),
  };
}

/**
 * Reads ONE buyer-owned support ticket by id plus its message thread.
 *
 * RLS ("support_tickets: buyer can select own" + "support_ticket_messages:
 * buyer can select own") is the real gate; the explicit buyer_id filter is
 * defensive. A ticket that does not exist OR belongs to another buyer returns
 * zero rows -> found:false (no existence leak). Junk ids are rejected before
 * hitting Postgres.
 */
export async function getBuyerSupportTicketThread(
  ticketId: string,
): Promise<BuyerSupportTicketThreadResult> {
  if (!ticketId || !isOrderIdShape(ticketId)) {
    return { backendReady: true, authenticated: true, found: false, thread: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, authenticated: false, found: false, thread: null };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, order_id, category, status, subject, created_at")
    .eq("id", ticketId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (ticketError) {
    if (isMissingTableError(ticketError)) {
      return { backendReady: false, authenticated: true, found: false, thread: null };
    }
    console.warn("[support] ticket thread read failed:", ticketError.message);
    return { backendReady: true, authenticated: true, found: false, thread: null };
  }

  if (!ticket) {
    return { backendReady: true, authenticated: true, found: false, thread: null };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("support_ticket_messages")
    .select("id, sender_role, message, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  if (messagesError && isMissingTableError(messagesError)) {
    return { backendReady: false, authenticated: true, found: false, thread: null };
  }
  if (messagesError) {
    console.warn("[support] ticket messages read failed:", messagesError.message);
  }

  return {
    backendReady: true,
    authenticated: true,
    found: true,
    thread: {
      id: ticket.id,
      orderId: ticket.order_id,
      category: ticket.category as SupportTicketCategory,
      status: ticket.status as SupportTicketStatus,
      subject: ticket.subject,
      createdAt: ticket.created_at,
      messages: (messages ?? []).map((row) => ({
        id: row.id,
        senderRole: row.sender_role as BuyerSupportTicketMessage["senderRole"],
        message: row.message,
        createdAt: row.created_at,
      })),
    },
  };
}
