// SERVER ONLY — admin support-ticket read layer (D1-B, hardened D4-A).
// Session client only; admin RLS is the gate. Pages must also gate with
// requireRole(["ADMIN"]).

import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

export type AdminSupportTicketSummary = {
  id: string;
  orderId: string | null;
  buyerId: string;
  category: string;
  status: string;
  priority: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportTicketMessage = {
  id: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function getAdminSupportTickets(): Promise<{
  backendReady: boolean;
  tickets: AdminSupportTicketSummary[];
}> {
  const db = await createClient();
  const { data, error } = await db
    .from("support_tickets")
    .select(
      "id, order_id, buyer_id, category, status, priority, subject, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return { backendReady: false, tickets: [] };
    console.warn("[admin-support] list query failed:", error.message);
    return { backendReady: true, tickets: [] };
  }
  return {
    backendReady: true,
    tickets: (data ?? []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      buyerId: row.buyer_id,
      category: row.category,
      status: row.status,
      priority: row.priority,
      subject: row.subject,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getAdminSupportTicket(id: string): Promise<
  | { found: true; ticket: AdminSupportTicketSummary; messages: AdminSupportTicketMessage[] }
  | { found: false; ticket: null; messages: [] }
> {
  if (!isOrderIdShape(id)) return { found: false, ticket: null, messages: [] };
  const db = await createClient();
  const { data: ticket, error } = await db
    .from("support_tickets")
    .select(
      "id, order_id, buyer_id, category, status, priority, subject, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[admin-support] detail query failed:", error.message);
    }
    return { found: false, ticket: null, messages: [] };
  }
  if (!ticket) return { found: false, ticket: null, messages: [] };

  const { data: messages, error: messagesError } = await db
    .from("support_ticket_messages")
    .select("id, sender_role, message, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  if (messagesError) {
    console.warn("[admin-support] messages query failed:", messagesError.message);
  }

  return {
    found: true,
    ticket: {
      id: ticket.id,
      orderId: ticket.order_id,
      buyerId: ticket.buyer_id,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      subject: ticket.subject,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    },
    messages: (messages ?? []).map((row) => ({
      id: row.id,
      senderRole: row.sender_role,
      message: row.message,
      createdAt: row.created_at,
    })),
  };
}
