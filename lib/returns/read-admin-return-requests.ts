// SERVER ONLY — admin return-request read layer (D1-B, hardened D4-A).
// Session client only; the admin RLS policy set is the gate — non-admin
// sessions get zero rows, never an error. Pages must also gate with
// requireRole(["ADMIN"]).

import { createClient } from "@/lib/supabase/server";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

export type AdminReturnRequestSummary = {
  id: string;
  orderId: string;
  buyerId: string;
  status: string;
  reason: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminReturnRequestItem = {
  id: string;
  orderItemId: string;
  quantity: number;
  reason: string | null;
  /** Joined order_items snapshot for operational context. */
  titleSnapshot: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  purchasedQuantity: number | null;
};

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function getAdminReturnRequests(): Promise<{
  backendReady: boolean;
  requests: AdminReturnRequestSummary[];
}> {
  const db = await createClient();
  const { data, error } = await db
    .from("return_requests")
    .select("id, order_id, buyer_id, status, reason, note, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return { backendReady: false, requests: [] };
    console.warn("[admin-returns] list query failed:", error.message);
    return { backendReady: true, requests: [] };
  }
  return {
    backendReady: true,
    requests: (data ?? []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      buyerId: row.buyer_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getAdminReturnRequest(id: string): Promise<
  | { found: true; request: AdminReturnRequestSummary; items: AdminReturnRequestItem[] }
  | { found: false; request: null; items: [] }
> {
  if (!isOrderIdShape(id)) return { found: false, request: null, items: [] };
  const db = await createClient();
  const { data: request, error } = await db
    .from("return_requests")
    .select("id, order_id, buyer_id, status, reason, note, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[admin-returns] detail query failed:", error.message);
    }
    return { found: false, request: null, items: [] };
  }
  if (!request) return { found: false, request: null, items: [] };

  const { data: items, error: itemsError } = await db
    .from("return_request_items")
    .select("id, order_item_id, quantity, reason")
    .eq("return_request_id", id);
  if (itemsError) {
    console.warn("[admin-returns] items query failed:", itemsError.message);
  }

  // Join order_items snapshots for readable operational context.
  const orderItemIds = (items ?? []).map((item) => item.order_item_id);
  const snapshotById = new Map<
    string,
    { title: string; size: string | null; color: string | null; qty: number }
  >();
  if (orderItemIds.length > 0) {
    const { data: lineRows, error: lineError } = await db
      .from("order_items")
      .select("id, title_snapshot, selected_size, selected_color, quantity")
      .in("id", orderItemIds);
    if (lineError) {
      console.warn("[admin-returns] line snapshot query failed:", lineError.message);
    }
    for (const row of lineRows ?? []) {
      snapshotById.set(row.id, {
        title: row.title_snapshot,
        size: row.selected_size,
        color: row.selected_color,
        qty: row.quantity,
      });
    }
  }

  return {
    found: true,
    request: {
      id: request.id,
      orderId: request.order_id,
      buyerId: request.buyer_id,
      status: request.status,
      reason: request.reason,
      note: request.note,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    },
    items: (items ?? []).map((item) => {
      const snapshot = snapshotById.get(item.order_item_id);
      return {
        id: item.id,
        orderItemId: item.order_item_id,
        quantity: item.quantity,
        reason: item.reason,
        titleSnapshot: snapshot?.title ?? null,
        selectedSize: snapshot?.size ?? null,
        selectedColor: snapshot?.color ?? null,
        purchasedQuantity: snapshot?.qty ?? null,
      };
    }),
  };
}
