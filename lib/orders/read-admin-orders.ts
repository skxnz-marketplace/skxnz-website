// SERVER ONLY — admin order read layer (D4-6).
//
// Reads ALL orders/items/events via the session-scoped client. The real gate
// is the D4-2 RLS policy set ("orders: admin can manage all" etc., backed by
// public.is_admin()): a non-admin session gets zero rows here, never an
// error. Pages calling these helpers must ALSO gate with
// requireRole(["ADMIN"]) so non-admins never reach the query at all.
// No service-role client is used for reads.
//
// Migration status: 0005 finalized, NOT applied live. 42P01 -> backendReady
// false so pages render an honest backend-not-ready state.

import { createClient } from "@/lib/supabase/server";
import {
  isOrderIdShape,
  type BuyerOrderItem,
  type BuyerOrderStatus,
} from "@/lib/orders/read-buyer-orders";

export type AdminOrderSummary = {
  id: string;
  /** Full buyer uuid — mask in UI (short code) rather than dropping it, so
   * admins can still cross-reference the users table when needed. */
  buyerId: string;
  status: BuyerOrderStatus;
  createdAt: string;
  subtotalPaise: number;
  totalPaise: number | null;
  /** Real DB fields; NULL until a real payment provider is wired. */
  paymentProvider: string | null;
  paymentReference: string | null;
  itemCount: number;
};

export type AdminOrderEvent = {
  id: string;
  eventType: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminOrderDetail = {
  id: string;
  buyerId: string;
  status: BuyerOrderStatus;
  createdAt: string;
  subtotalPaise: number;
  shippingPaise: number | null;
  taxPaise: number | null;
  totalPaise: number | null;
  paymentProvider: string | null;
  paymentReference: string | null;
  deliveryNote: string | null;
  items: BuyerOrderItem[];
  events: AdminOrderEvent[];
};

export type AdminOrdersResult =
  | { backendReady: true; orders: AdminOrderSummary[] }
  | { backendReady: false; orders: [] };

export type AdminOrderDetailResult =
  | { backendReady: true; order: AdminOrderDetail | null }
  | { backendReady: false; order: null };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

/** All orders, newest first. Non-admin sessions see zero rows (RLS). */
export async function getAdminOrders(): Promise<AdminOrdersResult> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, buyer_id, status, created_at, subtotal_amount_paise, total_amount_paise, payment_provider, payment_reference",
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, orders: [] };
    }
    console.warn("[admin-orders] list query failed:", error.message);
    return { backendReady: true, orders: [] };
  }

  if (!orders?.length) {
    return { backendReady: true, orders: [] };
  }

  const orderIds = orders.map((order) => order.id);
  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id")
    .in("order_id", orderIds);

  if (itemsError && !isMissingTableError(itemsError)) {
    console.warn("[admin-orders] item count query failed:", itemsError.message);
  }

  const countByOrderId = new Map<string, number>();
  for (const row of itemRows ?? []) {
    countByOrderId.set(row.order_id, (countByOrderId.get(row.order_id) ?? 0) + 1);
  }

  return {
    backendReady: true,
    orders: orders.map((order) => ({
      id: order.id,
      buyerId: order.buyer_id,
      status: order.status as BuyerOrderStatus,
      createdAt: order.created_at,
      subtotalPaise: order.subtotal_amount_paise,
      totalPaise: order.total_amount_paise,
      paymentProvider: order.payment_provider,
      paymentReference: order.payment_reference,
      itemCount: countByOrderId.get(order.id) ?? 0,
    })),
  };
}

/** One order with items and the order_events audit trail. Null when absent
 * (or when the session is not admin — RLS returns zero rows). */
export async function getAdminOrderById(
  orderId: string,
): Promise<AdminOrderDetailResult> {
  if (!isOrderIdShape(orderId)) {
    return { backendReady: true, order: null };
  }

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, buyer_id, status, created_at, subtotal_amount_paise, shipping_amount_paise, tax_amount_paise, total_amount_paise, payment_provider, payment_reference, delivery_note",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, order: null };
    }
    console.warn("[admin-orders] detail query failed:", error.message);
    return { backendReady: true, order: null };
  }
  if (!order) {
    return { backendReady: true, order: null };
  }

  const [itemsResult, eventsResult] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "id, product_slug, title_snapshot, brand_snapshot, image_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise",
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_events")
      .select("id, event_type, message, metadata, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
  ]);

  const relationError = itemsResult.error ?? eventsResult.error;
  if (relationError) {
    if (isMissingTableError(relationError)) {
      return { backendReady: false, order: null };
    }
    console.warn("[admin-orders] relations query failed:", relationError.message);
    return { backendReady: true, order: null };
  }

  return {
    backendReady: true,
    order: {
      id: order.id,
      buyerId: order.buyer_id,
      status: order.status as BuyerOrderStatus,
      createdAt: order.created_at,
      subtotalPaise: order.subtotal_amount_paise,
      shippingPaise: order.shipping_amount_paise,
      taxPaise: order.tax_amount_paise,
      totalPaise: order.total_amount_paise,
      paymentProvider: order.payment_provider,
      paymentReference: order.payment_reference,
      deliveryNote: order.delivery_note,
      items: (itemsResult.data ?? []).map((item) => ({
        id: item.id,
        productSlug: item.product_slug,
        titleSnapshot: item.title_snapshot,
        brandSnapshot: item.brand_snapshot,
        imageSnapshot: item.image_snapshot,
        selectedSize: item.selected_size,
        selectedColor: item.selected_color,
        unitPricePaise: item.unit_price_paise,
        quantity: item.quantity,
        lineTotalPaise: item.line_total_paise,
      })),
      events: (eventsResult.data ?? []).map((event) => ({
        id: event.id,
        eventType: event.event_type,
        message: event.message,
        metadata: (event.metadata ?? {}) as Record<string, unknown>,
        createdAt: event.created_at,
      })),
    },
  };
}
