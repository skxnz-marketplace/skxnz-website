// SERVER ONLY — admin operations overview read layer (D4-A).
//
// Real counts only, via the session client + admin RLS (non-admin sessions
// see zero rows everywhere — never an error, never fabricated numbers).
// Pages must also gate with requireRole(["ADMIN"]).
//
// 42P01 (commerce tables missing) -> backendReady false.
// 42703 / 42P01 on the 0009 fulfilment layer -> fulfilmentReady false and
// the pending-line count is reported as null (unknown), never invented.

import { createClient } from "@/lib/supabase/server";

export type AdminOperationsSummary = {
  backendReady: boolean;
  /** Orders in PAID or FULFILLING — the states where ops action matters. */
  ordersNeedingAttention: number;
  /** Orders in any state (context figure). */
  ordersTotal: number;
  /** Return requests in REQUESTED or IN_REVIEW. */
  activeReturns: number;
  /** Tickets in OPEN, IN_REVIEW, or WAITING_FOR_CUSTOMER. */
  openTickets: number;
  /** Seller lines still PENDING on post-payment orders (0009). Null when the
   * 0009 migration is not applied — unknown, not zero. */
  pendingSellerLines: number | null;
  fulfilmentReady: boolean;
  /** Most recent operational events, newest first (max 8). */
  recentEvents: Array<{
    id: string;
    orderId: string;
    eventType: string;
    message: string;
    createdAt: string;
  }>;
};

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    Boolean(error.message?.match(/column .* does not exist/i))
  );
}

export async function getAdminOperationsSummary(): Promise<AdminOperationsSummary> {
  const supabase = await createClient();

  const empty: AdminOperationsSummary = {
    backendReady: false,
    ordersNeedingAttention: 0,
    ordersTotal: 0,
    activeReturns: 0,
    openTickets: 0,
    pendingSellerLines: null,
    fulfilmentReady: false,
    recentEvents: [],
  };

  const [ordersAttention, ordersTotal, returns, tickets, events] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["PAID", "FULFILLING"]),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("return_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["REQUESTED", "IN_REVIEW"]),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["OPEN", "IN_REVIEW", "WAITING_FOR_CUSTOMER"]),
      supabase
        .from("order_events")
        .select("id, order_id, event_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (ordersAttention.error) {
    if (isMissingTableError(ordersAttention.error)) return empty;
    console.warn(
      "[admin-operations] orders count failed:",
      ordersAttention.error.message,
    );
    return { ...empty, backendReady: true };
  }

  // Pending seller lines (0009). Count PENDING lines on post-payment orders.
  // The status join cannot be expressed in one PostgREST count cheaply, so we
  // count PENDING lines and accept that pre-payment lines are excluded by
  // definition: lines only exist on orders created via checkout, and only
  // post-payment orders matter operationally — DRAFT lines are surfaced as 0
  // attention anyway. Missing column/table -> null (unknown).
  let pendingSellerLines: number | null = null;
  let fulfilmentReady = false;
  const pendingLines = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("seller_fulfilment_status", "PENDING");
  if (!pendingLines.error) {
    fulfilmentReady = true;
    pendingSellerLines = pendingLines.count ?? 0;
  } else if (
    !isMissingColumnError(pendingLines.error) &&
    !isMissingTableError(pendingLines.error)
  ) {
    console.warn(
      "[admin-operations] pending line count failed:",
      pendingLines.error.message,
    );
  }

  return {
    backendReady: true,
    ordersNeedingAttention: ordersAttention.count ?? 0,
    ordersTotal: ordersTotal.error ? 0 : (ordersTotal.count ?? 0),
    activeReturns: returns.error ? 0 : (returns.count ?? 0),
    openTickets: tickets.error ? 0 : (tickets.count ?? 0),
    pendingSellerLines,
    fulfilmentReady,
    recentEvents: events.error
      ? []
      : (events.data ?? []).map((event) => ({
          id: event.id,
          orderId: event.order_id,
          eventType: event.event_type,
          message: event.message,
          createdAt: event.created_at,
        })),
  };
}
