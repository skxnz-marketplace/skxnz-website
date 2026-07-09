// SERVER ONLY — buyer support-ticket read (D5-3).
//
// Lists the authenticated buyer's OWN support_tickets (0005 commerce schema).
// RLS ("support_tickets: buyer can select own") is the real gate; the buyer_id
// filter is defensive. backendReady is false only if 0005 is not applied
// (42P01) — the UI then shows an honest "not connected yet" state.

import { createClient } from "@/lib/supabase/server";
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
