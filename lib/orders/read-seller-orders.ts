// SERVER ONLY — seller order-line read layer (D3-A).
//
// Sellers see ONLY order_items whose product belongs to them, and ONLY on
// post-payment orders — both enforced by the D4-2 / 0006 RLS policy
// "order_items: seller can select own product lines" (routes through the
// SECURITY DEFINER helper `public.seller_owns_post_payment_order_line`,
// which bypasses the orders-RLS-blocks-sellers wrinkle documented in the
// Day-4 close report). Sellers can NOT select from public.orders at all,
// so no buyer identity, address, contact, or order totals are readable
// here — line snapshots only.
//
// Defensive extra: because a seller may also be a buyer (and the buyer
// select policy would union in their own purchased lines), this helper
// first resolves the seller's product ids and filters order_items to them
// explicitly. RLS remains the real gate; the filter keeps the queue precise.
//
// Migration status:
//   * 0005 applied live (D4-7).
//   * 0006 applied live (D4-7).
//   * 0009 (per-line fulfilment columns + order_item_events) DRAFT — see
//     supabase/migrations/0009_seller_line_fulfilment.sql. This file
//     detects Postgres 42703 (undefined_column) on the fulfilment fields
//     and reports `fulfilmentReady: false` so the UI can render truthful
//     copy without faking transitions.

import { createClient } from "@/lib/supabase/server";

export type SellerLineFulfilmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PACKED"
  | "HANDED_TO_DELIVERY";

export type SellerOrderLine = {
  id: string;
  /** Parent order id — used as a short reference only; the order row itself
   * is not readable by sellers (no buyer data leak). */
  orderId: string;
  productId: string | null;
  productSlug: string;
  titleSnapshot: string;
  brandSnapshot: string | null;
  imageSnapshot: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  createdAt: string;
  fulfilmentStatus: SellerLineFulfilmentStatus;
  fulfilmentNote: string | null;
  fulfilmentUpdatedAt: string | null;
};

export type SellerOrderSummary = {
  orderId: string;
  earliestCreatedAt: string;
  latestCreatedAt: string;
  lineCount: number;
  quantityTotal: number;
  /** Sum of the seller's own line totals ONLY. This is not a whole-order
   * total — other sellers' lines and any shipping/tax are excluded. */
  sellerSubtotalPaise: number;
  /** Aggregate seller-line fulfilment state — the earliest step across the
   * seller's lines on this order (so "PENDING" wins over "PACKED"). */
  aggregateFulfilmentStatus: SellerLineFulfilmentStatus;
};

export type SellerOrdersResult =
  | {
      backendReady: true;
      fulfilmentReady: boolean;
      orders: SellerOrderSummary[];
    }
  | {
      backendReady: false;
      fulfilmentReady: false;
      orders: [];
    };

export type SellerOrderDetail = {
  orderId: string;
  createdAt: string;
  lines: SellerOrderLine[];
  quantityTotal: number;
  sellerSubtotalPaise: number;
};

export type SellerOrderDetailResult =
  | {
      backendReady: true;
      fulfilmentReady: boolean;
      order: SellerOrderDetail | null;
    }
  | {
      backendReady: false;
      fulfilmentReady: false;
      order: null;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSellerOrderIdShape(value: string): boolean {
  return UUID_PATTERN.test(value);
}

// Postgres 42P01 = undefined_table -> 0005 not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

// Postgres 42703 = undefined_column -> 0009 not applied yet.
function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    Boolean(error.message?.match(/column .* does not exist/i))
  );
}

const FULFILMENT_ORDER: SellerLineFulfilmentStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PACKED",
  "HANDED_TO_DELIVERY",
];

function earliestFulfilment(
  a: SellerLineFulfilmentStatus,
  b: SellerLineFulfilmentStatus,
): SellerLineFulfilmentStatus {
  return FULFILMENT_ORDER.indexOf(a) <= FULFILMENT_ORDER.indexOf(b) ? a : b;
}

function normaliseFulfilment(
  raw: unknown,
): SellerLineFulfilmentStatus {
  if (typeof raw === "string" && (FULFILMENT_ORDER as readonly string[]).includes(raw)) {
    return raw as SellerLineFulfilmentStatus;
  }
  return "PENDING";
}

const LINE_SELECT_WITH_FULFILMENT =
  "id, order_id, product_id, product_slug, title_snapshot, brand_snapshot, image_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise, created_at, seller_fulfilment_status, seller_fulfilment_note, seller_fulfilment_updated_at";

const LINE_SELECT_LEGACY =
  "id, order_id, product_id, product_slug, title_snapshot, brand_snapshot, image_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise, created_at";

type RawLineRow = {
  id: string;
  order_id: string;
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
  created_at: string;
  seller_fulfilment_status?: unknown;
  seller_fulfilment_note?: unknown;
  seller_fulfilment_updated_at?: unknown;
};

function mapRawLine(
  row: RawLineRow,
  fulfilmentReady: boolean,
): SellerOrderLine {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productSlug: row.product_slug,
    titleSnapshot: row.title_snapshot,
    brandSnapshot: row.brand_snapshot,
    imageSnapshot: row.image_snapshot,
    selectedSize: row.selected_size,
    selectedColor: row.selected_color,
    unitPricePaise: row.unit_price_paise,
    quantity: row.quantity,
    lineTotalPaise: row.line_total_paise,
    createdAt: row.created_at,
    fulfilmentStatus: fulfilmentReady
      ? normaliseFulfilment(row.seller_fulfilment_status)
      : "PENDING",
    fulfilmentNote: fulfilmentReady
      ? typeof row.seller_fulfilment_note === "string"
        ? row.seller_fulfilment_note
        : null
      : null,
    fulfilmentUpdatedAt: fulfilmentReady
      ? typeof row.seller_fulfilment_updated_at === "string"
        ? row.seller_fulfilment_updated_at
        : null
      : null,
  };
}

/** Resolve the authenticated seller's product ids via the products RLS
 * "seller can select own". Returns null when the query itself fails
 * (already logged) so callers can treat it as an empty result. */
async function sellerProductIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ ids: string[]; backendReady: boolean } | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", userId);
  if (error) {
    if (isMissingTableError(error)) {
      return { ids: [], backendReady: false };
    }
    console.warn("[seller-orders] product lookup failed:", error.message);
    return null;
  }
  return {
    ids: (data ?? []).map((row) => row.id),
    backendReady: true,
  };
}

async function runLineQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  columns: string,
  productIds: string[],
  orderId?: string,
) {
  let query = supabase
    .from("order_items")
    .select(columns)
    .in("product_id", productIds);
  if (orderId) query = query.eq("order_id", orderId);
  return query.order("created_at", { ascending: false });
}

async function selectSellerLines(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productIds: string[],
  orderId?: string,
): Promise<
  | { kind: "ok"; lines: RawLineRow[]; fulfilmentReady: boolean }
  | { kind: "missing_table" }
  | { kind: "error" }
> {
  // First attempt: with fulfilment columns.
  const first = await runLineQuery(
    supabase,
    LINE_SELECT_WITH_FULFILMENT,
    productIds,
    orderId,
  );
  if (!first.error) {
    return {
      kind: "ok",
      lines: (first.data ?? []) as unknown as RawLineRow[],
      fulfilmentReady: true,
    };
  }
  if (isMissingTableError(first.error)) return { kind: "missing_table" };
  if (isMissingColumnError(first.error)) {
    // 0009 not applied — retry with the legacy column set so the queue
    // still renders honestly (all lines report PENDING).
    const legacy = await runLineQuery(
      supabase,
      LINE_SELECT_LEGACY,
      productIds,
      orderId,
    );
    if (!legacy.error) {
      return {
        kind: "ok",
        lines: (legacy.data ?? []) as unknown as RawLineRow[],
        fulfilmentReady: false,
      };
    }
    if (isMissingTableError(legacy.error)) return { kind: "missing_table" };
    console.warn("[seller-orders] legacy line query failed:", legacy.error.message);
    return { kind: "error" };
  }
  console.warn("[seller-orders] line query failed:", first.error.message);
  return { kind: "error" };
}

/** Grouped seller order queue — one row per parent order the seller has
 * lines in. Only the seller's own lines contribute to counts and totals. */
export async function getSellerOrders(): Promise<SellerOrdersResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, fulfilmentReady: false, orders: [] };
  }

  const productResult = await sellerProductIds(supabase, user.id);
  if (!productResult) {
    return { backendReady: true, fulfilmentReady: false, orders: [] };
  }
  if (!productResult.backendReady) {
    return { backendReady: false, fulfilmentReady: false, orders: [] };
  }
  if (productResult.ids.length === 0) {
    return { backendReady: true, fulfilmentReady: true, orders: [] };
  }

  const lineResult = await selectSellerLines(supabase, productResult.ids);
  if (lineResult.kind === "missing_table") {
    return { backendReady: false, fulfilmentReady: false, orders: [] };
  }
  if (lineResult.kind === "error") {
    return {
      backendReady: true,
      fulfilmentReady: false,
      orders: [],
    };
  }

  const grouped = new Map<string, SellerOrderLine[]>();
  for (const raw of lineResult.lines) {
    const line = mapRawLine(raw, lineResult.fulfilmentReady);
    const bucket = grouped.get(line.orderId);
    if (bucket) {
      bucket.push(line);
    } else {
      grouped.set(line.orderId, [line]);
    }
  }

  const orders: SellerOrderSummary[] = Array.from(grouped.entries()).map(
    ([orderId, lines]) => {
      const earliest = lines.reduce(
        (acc, line) => (line.createdAt < acc ? line.createdAt : acc),
        lines[0].createdAt,
      );
      const latest = lines.reduce(
        (acc, line) => (line.createdAt > acc ? line.createdAt : acc),
        lines[0].createdAt,
      );
      const quantityTotal = lines.reduce((acc, line) => acc + line.quantity, 0);
      const sellerSubtotalPaise = lines.reduce(
        (acc, line) => acc + line.lineTotalPaise,
        0,
      );
      const aggregate = lines.reduce<SellerLineFulfilmentStatus>(
        (acc, line) => earliestFulfilment(acc, line.fulfilmentStatus),
        "HANDED_TO_DELIVERY",
      );
      return {
        orderId,
        earliestCreatedAt: earliest,
        latestCreatedAt: latest,
        lineCount: lines.length,
        quantityTotal,
        sellerSubtotalPaise,
        aggregateFulfilmentStatus: aggregate,
      };
    },
  );

  orders.sort((a, b) => (a.latestCreatedAt < b.latestCreatedAt ? 1 : -1));

  return {
    backendReady: true,
    fulfilmentReady: lineResult.fulfilmentReady,
    orders,
  };
}

/** Detail view for one order — returns only the seller's own lines on it.
 * Cross-seller / cross-order / unrelated ids resolve to `order: null`, so
 * the page can render notFound() without leaking whether the order exists. */
export async function getSellerOrderById(
  orderId: string,
): Promise<SellerOrderDetailResult> {
  if (!isSellerOrderIdShape(orderId)) {
    return { backendReady: true, fulfilmentReady: false, order: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, fulfilmentReady: false, order: null };
  }

  const productResult = await sellerProductIds(supabase, user.id);
  if (!productResult) {
    return { backendReady: true, fulfilmentReady: false, order: null };
  }
  if (!productResult.backendReady) {
    return { backendReady: false, fulfilmentReady: false, order: null };
  }
  if (productResult.ids.length === 0) {
    return { backendReady: true, fulfilmentReady: true, order: null };
  }

  const lineResult = await selectSellerLines(supabase, productResult.ids, orderId);
  if (lineResult.kind === "missing_table") {
    return { backendReady: false, fulfilmentReady: false, order: null };
  }
  if (lineResult.kind === "error") {
    return { backendReady: true, fulfilmentReady: false, order: null };
  }
  if (lineResult.lines.length === 0) {
    return {
      backendReady: true,
      fulfilmentReady: lineResult.fulfilmentReady,
      order: null,
    };
  }

  const lines = lineResult.lines
    .map((raw) => mapRawLine(raw, lineResult.fulfilmentReady))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  const quantityTotal = lines.reduce((acc, line) => acc + line.quantity, 0);
  const sellerSubtotalPaise = lines.reduce(
    (acc, line) => acc + line.lineTotalPaise,
    0,
  );

  return {
    backendReady: true,
    fulfilmentReady: lineResult.fulfilmentReady,
    order: {
      orderId,
      createdAt: lines[0].createdAt,
      lines,
      quantityTotal,
      sellerSubtotalPaise,
    },
  };
}

/** Honest, seller-facing label per line fulfilment step. */
export function describeSellerFulfilment(
  status: SellerLineFulfilmentStatus,
): { label: string; note: string } {
  switch (status) {
    case "PENDING":
      return {
        label: "Awaiting action",
        note: "Buyer has paid. Accept the line to start preparing it.",
      };
    case "ACCEPTED":
      return {
        label: "Accepted — preparing",
        note: "You have accepted the line. Prepare and pack it next.",
      };
    case "PACKED":
      return {
        label: "Packed",
        note: "Packed and ready for hand-off to the delivery partner.",
      };
    case "HANDED_TO_DELIVERY":
      return {
        label: "Handed to delivery",
        note: "You have handed the parcel to a delivery partner.",
      };
  }
}

export const NEXT_SELLER_FULFILMENT: Record<
  SellerLineFulfilmentStatus,
  SellerLineFulfilmentStatus | null
> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PACKED",
  PACKED: "HANDED_TO_DELIVERY",
  HANDED_TO_DELIVERY: null,
};

/** Backwards-compat with D4-6 UI code. Prefer getSellerOrders(). */
export type SellerOrderLinesResult =
  | { backendReady: true; lines: SellerOrderLine[] }
  | { backendReady: false; lines: [] };

export async function getSellerOrderLines(): Promise<SellerOrderLinesResult> {
  const grouped = await getSellerOrders();
  if (!grouped.backendReady) {
    return { backendReady: false, lines: [] };
  }
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id ?? "";
  if (!uid) return { backendReady: true, lines: [] };
  const productResult = await sellerProductIds(supabase, uid);
  if (!productResult || !productResult.backendReady) {
    return { backendReady: true, lines: [] };
  }
  if (productResult.ids.length === 0) return { backendReady: true, lines: [] };
  const lineResult = await selectSellerLines(supabase, productResult.ids);
  if (lineResult.kind !== "ok") return { backendReady: true, lines: [] };
  return {
    backendReady: true,
    lines: lineResult.lines.map((raw) => mapRawLine(raw, lineResult.fulfilmentReady)),
  };
}
