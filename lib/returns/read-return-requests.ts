// SERVER ONLY — buyer return-request read (D5-4A).
//
// Lists the authenticated buyer's OWN return_requests (0005 commerce schema)
// with a per-request item count. RLS ("return_requests: buyer can select own")
// is the real gate; the buyer_id filter is defensive. backendReady is false
// only if 0005 is not applied (42P01) — the UI then shows an honest "not
// connected yet" state.
//
// Read-only. Nothing here approves a return, schedules a pickup, or issues a
// refund — those are server-only statuses set after real provider/ops action.

import { createClient } from "@/lib/supabase/server";
import type { ReturnRequestStatus } from "@/lib/returns/return-requests";

export type BuyerReturnRequest = {
  id: string;
  orderId: string;
  status: ReturnRequestStatus;
  reason: string;
  note: string | null;
  itemCount: number;
  createdAt: string;
};

export type BuyerReturnRequestsResult =
  | { backendReady: true; authenticated: boolean; returns: BuyerReturnRequest[] }
  | { backendReady: false; authenticated: boolean; returns: [] };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function getBuyerReturnRequests(): Promise<BuyerReturnRequestsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, authenticated: false, returns: [] };
  }

  const { data, error } = await supabase
    .from("return_requests")
    .select("id, order_id, status, reason, note, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, authenticated: true, returns: [] };
    }
    console.warn("[returns] request read failed:", error.message);
    return { backendReady: true, authenticated: true, returns: [] };
  }

  const rows = data ?? [];

  // Item counts in one extra RLS-scoped query (buyer owns items via the parent
  // return_request policy). Missing tables/errors degrade to a 0 count — the
  // list still renders honestly rather than failing.
  const counts = new Map<string, number>();
  if (rows.length > 0) {
    const { data: itemRows, error: itemError } = await supabase
      .from("return_request_items")
      .select("return_request_id")
      .in(
        "return_request_id",
        rows.map((row) => row.id),
      );

    if (itemError) {
      console.warn("[returns] item count read failed:", itemError.message);
    } else {
      for (const item of itemRows ?? []) {
        const key = item.return_request_id as string;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return {
    backendReady: true,
    authenticated: true,
    returns: rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      status: row.status as ReturnRequestStatus,
      reason: row.reason,
      note: row.note,
      itemCount: counts.get(row.id) ?? 0,
      createdAt: row.created_at,
    })),
  };
}
