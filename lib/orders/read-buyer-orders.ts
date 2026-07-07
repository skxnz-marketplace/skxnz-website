// SERVER ONLY — buyer order read layer (D4-4).
//
// Reads the authenticated buyer's OWN orders from the 0005 commerce schema
// (supabase/migrations/0005_commerce_layer.sql). Uses the session-scoped
// server client, so RLS ("orders: buyer can select own") is the real gate;
// the explicit buyer_id filters here are defensive only. buyer identity is
// never accepted from params or client input.
//
// Migration status: 0005 is finalized but NOT applied live yet. Every
// function detects Postgres 42P01 (undefined_table) and reports
// `backendReady: false` so pages can render an honest backend-not-ready
// state instead of throwing or faking data.

import { createClient } from "@/lib/supabase/server";

/** Matches orders.status check constraint in 0005. */
export type BuyerOrderStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FULFILLING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type BuyerOrderSummary = {
  id: string;
  status: BuyerOrderStatus;
  createdAt: string;
  subtotalPaise: number;
  /** NULL until a real total (with shipping/tax) is computed server-side. */
  totalPaise: number | null;
  itemCount: number;
};

export type BuyerOrderItem = {
  id: string;
  productSlug: string;
  titleSnapshot: string;
  brandSnapshot: string | null;
  imageSnapshot: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

export type BuyerOrderAddressSnapshot = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type BuyerOrderDetail = {
  id: string;
  status: BuyerOrderStatus;
  createdAt: string;
  subtotalPaise: number;
  shippingPaise: number | null;
  taxPaise: number | null;
  totalPaise: number | null;
  deliveryNote: string | null;
  shippingAddress: BuyerOrderAddressSnapshot | null;
  items: BuyerOrderItem[];
};

export type BuyerOrdersResult =
  | { backendReady: true; orders: BuyerOrderSummary[] }
  | { backendReady: false; orders: [] };

export type BuyerOrderDetailResult =
  | { backendReady: true; order: BuyerOrderDetail | null }
  | { backendReady: false; order: null };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the param looks like a uuid — avoids pointless DB round trips
 * and Postgres `invalid input syntax for type uuid` errors for junk URLs. */
export function isOrderIdShape(value: string): boolean {
  return UUID_PATTERN.test(value);
}

type OrderRow = {
  id: string;
  status: BuyerOrderStatus;
  created_at: string;
  subtotal_amount_paise: number;
  shipping_amount_paise: number | null;
  tax_amount_paise: number | null;
  total_amount_paise: number | null;
  delivery_note: string | null;
  shipping_address_snapshot: Record<string, unknown> | null;
};

function mapAddressSnapshot(
  raw: Record<string, unknown> | null,
): BuyerOrderAddressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : "");
  const snapshot = {
    line1: text("line1"),
    line2: text("line2"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    country: text("country"),
  };
  return snapshot.line1 || snapshot.city ? snapshot : null;
}

/** All orders belonging to the authenticated buyer, newest first. */
export async function getBuyerOrders(): Promise<BuyerOrdersResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated /orders traffic; this is
  // the server-side backstop.
  if (userError || !user) {
    return { backendReady: true, orders: [] };
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, subtotal_amount_paise, total_amount_paise",
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, orders: [] };
    }
    console.warn("[orders] getBuyerOrders failed:", error.message);
    return { backendReady: true, orders: [] };
  }

  if (!orders?.length) {
    return { backendReady: true, orders: [] };
  }

  // Item counts in one query (RLS restricts rows to the buyer's orders).
  const orderIds = orders.map((order) => order.id);
  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id")
    .in("order_id", orderIds);

  if (itemsError && !isMissingTableError(itemsError)) {
    console.warn("[orders] item count query failed:", itemsError.message);
  }

  const countByOrderId = new Map<string, number>();
  for (const row of itemRows ?? []) {
    countByOrderId.set(row.order_id, (countByOrderId.get(row.order_id) ?? 0) + 1);
  }

  return {
    backendReady: true,
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status as BuyerOrderStatus,
      createdAt: order.created_at,
      subtotalPaise: order.subtotal_amount_paise,
      totalPaise: order.total_amount_paise,
      itemCount: countByOrderId.get(order.id) ?? 0,
    })),
  };
}

/** One buyer-owned order with its items; null when absent or not owned
 * (RLS returns zero rows for another buyer's order — no existence leak). */
export async function getBuyerOrderById(
  orderId: string,
): Promise<BuyerOrderDetailResult> {
  if (!isOrderIdShape(orderId)) {
    return { backendReady: true, order: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, order: null };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, subtotal_amount_paise, shipping_amount_paise, tax_amount_paise, total_amount_paise, delivery_note, shipping_address_snapshot",
    )
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, order: null };
    }
    console.warn("[orders] getBuyerOrderById failed:", error.message);
    return { backendReady: true, order: null };
  }

  if (!order) {
    return { backendReady: true, order: null };
  }

  const orderRow = order as OrderRow;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "id, product_slug, title_snapshot, brand_snapshot, image_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise",
    )
    .eq("order_id", orderRow.id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    if (isMissingTableError(itemsError)) {
      return { backendReady: false, order: null };
    }
    console.warn("[orders] order items read failed:", itemsError.message);
    return { backendReady: true, order: null };
  }

  return {
    backendReady: true,
    order: {
      id: orderRow.id,
      status: orderRow.status,
      createdAt: orderRow.created_at,
      subtotalPaise: orderRow.subtotal_amount_paise,
      shippingPaise: orderRow.shipping_amount_paise,
      taxPaise: orderRow.tax_amount_paise,
      totalPaise: orderRow.total_amount_paise,
      deliveryNote: orderRow.delivery_note,
      shippingAddress: mapAddressSnapshot(orderRow.shipping_address_snapshot),
      items: (items ?? []).map((item) => ({
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
    },
  };
}

/** Honest, buyer-facing label per status. DRAFT/PAYMENT_PENDING are clearly
 * marked unpaid — no implied payment or delivery progress. */
export function describeOrderStatus(status: BuyerOrderStatus): {
  label: string;
  note: string;
} {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft — not paid",
        note: "Checkout is not completed. No payment has been taken and nothing will ship for this draft.",
      };
    case "PAYMENT_PENDING":
      return {
        label: "Payment pending — not paid",
        note: "Payment has not been completed. Nothing has been charged yet.",
      };
    case "PAID":
      return { label: "Paid", note: "Payment confirmed. Preparing fulfilment." };
    case "FULFILLING":
      return { label: "Fulfilling", note: "The order is being prepared." };
    case "SHIPPED":
      return { label: "Shipped", note: "The order has been dispatched." };
    case "DELIVERED":
      return { label: "Delivered", note: "The order has been delivered." };
    case "CANCELLED":
      return { label: "Cancelled", note: "This order was cancelled." };
    case "REFUNDED":
      return { label: "Refunded", note: "This order was refunded." };
  }
}
