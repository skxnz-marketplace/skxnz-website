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

/** Per-line seller fulfilment view (D3-A / migration 0009). All values come
 * from real columns; when 0009 is not applied, `fulfilmentReady` on the
 * detail is false and these stay at their defaults. */
export type AdminOrderItemOps = BuyerOrderItem & {
  productId: string | null;
  /** Owning seller uuid from public.products — masked to short code in UI. */
  sellerId: string | null;
  fulfilmentStatus: string | null;
  fulfilmentNote: string | null;
  fulfilmentUpdatedAt: string | null;
};

export type AdminOrderLineEvent = {
  id: string;
  orderItemId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
  createdAt: string;
};

export type AdminOrderReturnSummary = {
  id: string;
  status: string;
  reason: string;
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
  items: AdminOrderItemOps[];
  events: AdminOrderEvent[];
  /** True when the 0009 seller-line fulfilment columns exist live. */
  fulfilmentReady: boolean;
  /** Per-line audit events (0009 order_item_events); empty pre-0009. */
  lineEvents: AdminOrderLineEvent[];
  /** Return requests attached to this order (admin RLS read). */
  returnRequests: AdminOrderReturnSummary[];
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

// Postgres 42703 = undefined_column -> 0009 fulfilment columns not applied.
function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    Boolean(error.message?.match(/column .* does not exist/i))
  );
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

  // Items: try the 0009 fulfilment column set first; on 42703 fall back to
  // the legacy set so the page keeps rendering truthfully pre-migration.
  const ITEM_COLUMNS_BASE =
    "id, product_id, product_slug, title_snapshot, brand_snapshot, image_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise";
  const ITEM_COLUMNS_0009 = `${ITEM_COLUMNS_BASE}, seller_fulfilment_status, seller_fulfilment_note, seller_fulfilment_updated_at`;

  let fulfilmentReady = true;
  let itemsResult: {
    data: unknown[] | null;
    error: { code?: string; message?: string } | null;
  } = await supabase
    .from("order_items")
    .select(ITEM_COLUMNS_0009)
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (itemsResult.error && isMissingColumnError(itemsResult.error)) {
    fulfilmentReady = false;
    itemsResult = await supabase
      .from("order_items")
      .select(ITEM_COLUMNS_BASE)
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
  }

  const eventsResult = await supabase
    .from("order_events")
    .select("id, event_type, message, metadata, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const relationError = itemsResult.error ?? eventsResult.error;
  if (relationError) {
    if (isMissingTableError(relationError)) {
      return { backendReady: false, order: null };
    }
    console.warn("[admin-orders] relations query failed:", relationError.message);
    return { backendReady: true, order: null };
  }

  type ItemRow = {
    id: string;
    product_id: string | null;
    product_slug: string;
    title_snapshot: string;
    brand_snapshot: string | null;
    image_snapshot: string | null;
    selected_size: string | null;
    selected_color: string | null;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
    seller_fulfilment_status?: string | null;
    seller_fulfilment_note?: string | null;
    seller_fulfilment_updated_at?: string | null;
  };
  const itemRows = (itemsResult.data ?? []) as unknown as ItemRow[];

  // Seller ownership per line via products (admin RLS: full read).
  const productIds = Array.from(
    new Set(itemRows.map((row) => row.product_id).filter(Boolean)),
  ) as string[];
  const sellerByProductId = new Map<string, string | null>();
  if (productIds.length > 0) {
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, seller_id")
      .in("id", productIds);
    if (productError) {
      console.warn("[admin-orders] product owner query failed:", productError.message);
    }
    for (const row of productRows ?? []) {
      sellerByProductId.set(row.id, row.seller_id ?? null);
    }
  }

  // Per-line audit events (0009 order_item_events). Missing table -> empty.
  let lineEvents: AdminOrderLineEvent[] = [];
  const itemIds = itemRows.map((row) => row.id);
  if (fulfilmentReady && itemIds.length > 0) {
    const { data: lineEventRows, error: lineEventsError } = await supabase
      .from("order_item_events")
      .select("id, order_item_id, event_type, from_status, to_status, message, created_at")
      .in("order_item_id", itemIds)
      .order("created_at", { ascending: true });
    if (lineEventsError) {
      if (!isMissingTableError(lineEventsError)) {
        console.warn(
          "[admin-orders] line events query failed:",
          lineEventsError.message,
        );
      }
    } else {
      lineEvents = (lineEventRows ?? []).map((event) => ({
        id: event.id,
        orderItemId: event.order_item_id,
        eventType: event.event_type,
        fromStatus: event.from_status,
        toStatus: event.to_status,
        message: event.message,
        createdAt: event.created_at,
      }));
    }
  }

  // Return requests attached to this order (admin RLS read). 42P01-safe.
  let returnRequests: AdminOrderReturnSummary[] = [];
  const { data: returnRows, error: returnsError } = await supabase
    .from("return_requests")
    .select("id, status, reason, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });
  if (returnsError) {
    if (!isMissingTableError(returnsError)) {
      console.warn("[admin-orders] returns query failed:", returnsError.message);
    }
  } else {
    returnRequests = (returnRows ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      reason: row.reason,
      createdAt: row.created_at,
    }));
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
      items: itemRows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        sellerId: item.product_id
          ? (sellerByProductId.get(item.product_id) ?? null)
          : null,
        productSlug: item.product_slug,
        titleSnapshot: item.title_snapshot,
        brandSnapshot: item.brand_snapshot,
        imageSnapshot: item.image_snapshot,
        selectedSize: item.selected_size,
        selectedColor: item.selected_color,
        unitPricePaise: item.unit_price_paise,
        quantity: item.quantity,
        lineTotalPaise: item.line_total_paise,
        fulfilmentStatus: fulfilmentReady
          ? (item.seller_fulfilment_status ?? "PENDING")
          : null,
        fulfilmentNote: fulfilmentReady
          ? (item.seller_fulfilment_note ?? null)
          : null,
        fulfilmentUpdatedAt: fulfilmentReady
          ? (item.seller_fulfilment_updated_at ?? null)
          : null,
      })),
      events: (eventsResult.data ?? []).map((event) => ({
        id: event.id,
        eventType: event.event_type,
        message: event.message,
        metadata: (event.metadata ?? {}) as Record<string, unknown>,
        createdAt: event.created_at,
      })),
      fulfilmentReady,
      lineEvents,
      returnRequests,
    },
  };
}
