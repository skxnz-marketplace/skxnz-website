import type { DemoCheckoutOrder } from "@/components/checkout/demo-checkout-data";
import { demoBuyerUserId } from "@/lib/data/addresses";
import type {
  Address,
  DemoOrder,
  DemoOrderItem,
  DemoOrderStatus,
} from "@/lib/types/skxnz-data";

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Return Requested"
  | "Returned"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded"
  | "Not Connected in MVP";

export type DeliveryStatus =
  | "Not Assigned"
  | "Pickup Pending"
  | "Picked Up"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery";

export type ReturnStatus =
  | "Not Requested"
  | "Requested"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Picked Up"
  | "Refunded"
  | "Closed";

export type AdminOrderActionState =
  | "Awaiting Review"
  | "Reviewed"
  | "Escalated"
  | "Refund Placeholder";

export type MarketplaceOrder = {
  id: string;
  buyerProfileId: string;
  sellerProfileId: string;
  buyerName: string;
  buyerCity: string;
  sellerName: string;
  productId: string;
  productName: string;
  amount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  returnStatus: ReturnStatus;
  dispatchStatus: string;
  adminActionState: AdminOrderActionState;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
  paymentNote: string;
  deliveryNote: string;
  returnNote: string;
};

export type OrderTimelineStep = {
  label: string;
  detail: string;
  timestamp: string;
  state: "complete" | "current" | "upcoming";
};

export type ReturnRequestRecord = {
  id: string;
  orderId: string;
  orderItemId: string | null;
  buyerName: string;
  buyerProfileId: string;
  sellerName: string;
  sellerProfileId: string;
  productName: string;
  reason: string;
  issueType: string;
  photoProofLink: string;
  message: string;
  status: ReturnStatus;
  returnStatus: ReturnStatus;
  refundStatus: PaymentStatus;
  requestedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReturnRequestInput = {
  orderId: string;
  productName: string;
  reason: string;
  issueType: string;
  photoProofLink: string;
  message: string;
};

export const demoBuyerName = "Demo Buyer";

export const orderStatusFlow: OrderStatus[] = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export const seedOrders: MarketplaceOrder[] = [
  {
    id: "SKX-1008",
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerProfileId: "seller_profile_skxnz",
    buyerName: demoBuyerName,
    buyerCity: "Mumbai",
    sellerName: "SKXNZ Studio",
    productId: "chrome-trace-hoodie",
    productName: "Chrome Trace Hoodie",
    amount: 3499,
    subtotalCents: 349900,
    shippingCents: 0,
    totalCents: 349900,
    currency: "INR",
    orderStatus: "Confirmed",
    paymentStatus: "Not Connected in MVP",
    deliveryStatus: "Pickup Pending",
    returnStatus: "Not Requested",
    dispatchStatus: "Awaiting Dispatch",
    adminActionState: "Awaiting Review",
    placedAt: "Today, 10:24",
    createdAt: "Today, 10:24",
    updatedAt: "Today, 10:24",
    paymentNote: "Checkout is not live in MVP, so this payment state is placeholder-only.",
    deliveryNote: "Carrier assignment is not connected yet. Delivery status is mock-only.",
    returnNote: "No return has been requested for this order in the MVP.",
  },
  {
    id: "SKX-1007",
    buyerProfileId: "buyer_profile_rhea",
    sellerProfileId: "seller_profile_signal_studio",
    buyerName: "Rhea K.",
    buyerCity: "Delhi",
    sellerName: "Signal Studio",
    productId: "signal-layered-shirt",
    productName: "Signal Layered Shirt",
    amount: 2899,
    subtotalCents: 289900,
    shippingCents: 0,
    totalCents: 289900,
    currency: "INR",
    orderStatus: "Packed",
    paymentStatus: "Pending",
    deliveryStatus: "Picked Up",
    returnStatus: "Not Requested",
    dispatchStatus: "Packed",
    adminActionState: "Reviewed",
    placedAt: "Today, 08:03",
    createdAt: "Today, 08:03",
    updatedAt: "Today, 08:40",
    paymentNote: "Pending is mock-only in the MVP and does not reflect a real captured payment.",
    deliveryNote: "Picked-up status is a placeholder for future shipping workflow checks.",
    returnNote: "Return handling is not active for this order in MVP mode.",
  },
  {
    id: "SKX-1006",
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerProfileId: "seller_profile_skxnz",
    buyerName: demoBuyerName,
    buyerCity: "Bengaluru",
    sellerName: "SKXNZ Studio",
    productId: "pearl-white-sneakers",
    productName: "Pearl White Sneakers",
    amount: 5999,
    subtotalCents: 599900,
    shippingCents: 0,
    totalCents: 599900,
    currency: "INR",
    orderStatus: "Shipped",
    paymentStatus: "Paid",
    deliveryStatus: "In Transit",
    returnStatus: "Not Requested",
    dispatchStatus: "Picked Up",
    adminActionState: "Awaiting Review",
    placedAt: "Yesterday, 19:20",
    createdAt: "Yesterday, 19:20",
    updatedAt: "Yesterday, 19:20",
    paymentNote: "Paid is mock-only here and does not represent a live gateway capture.",
    deliveryNote: "Transit milestones are placeholders until carrier APIs are connected.",
    returnNote: "No return has been requested for this shipped order yet.",
  },
  {
    id: "SKX-1005",
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerProfileId: "seller_profile_demo_atelier",
    buyerName: demoBuyerName,
    buyerCity: "Pune",
    sellerName: "Demo Atelier",
    productId: "demo-atelier-long-coat",
    productName: "Demo Atelier Long Coat",
    amount: 7199,
    subtotalCents: 719900,
    shippingCents: 0,
    totalCents: 719900,
    currency: "INR",
    orderStatus: "Return Requested",
    paymentStatus: "Paid",
    deliveryStatus: "Delivered",
    returnStatus: "Requested",
    dispatchStatus: "Delivered",
    adminActionState: "Escalated",
    placedAt: "Yesterday, 17:46",
    createdAt: "Yesterday, 17:46",
    updatedAt: "Today, 09:30",
    paymentNote: "Payment is mock-only, and no real refund workflow is connected yet.",
    deliveryNote: "Delivered is a seeded lifecycle state for demo purposes only.",
    returnNote: "Buyer has opened a return request in local MVP state.",
  },
  {
    id: "SKX-1004",
    buyerProfileId: "buyer_profile_aarav",
    sellerProfileId: "seller_profile_chrome_district",
    buyerName: "Aarav M.",
    buyerCity: "Hyderabad",
    sellerName: "Chrome District",
    productId: "future-runner-crossbody",
    productName: "Future Runner Crossbody",
    amount: 3199,
    subtotalCents: 319900,
    shippingCents: 0,
    totalCents: 319900,
    currency: "INR",
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    deliveryStatus: "Delivered",
    returnStatus: "Closed",
    dispatchStatus: "Delivered",
    adminActionState: "Reviewed",
    placedAt: "Yesterday, 11:12",
    createdAt: "Yesterday, 11:12",
    updatedAt: "Yesterday, 16:05",
    paymentNote: "Mock paid state only. Refund processing is not connected in the MVP.",
    deliveryNote: "Carrier tracking is not live, even when the mock delivery state says delivered.",
    returnNote: "This seeded return case is closed for placeholder workflow review.",
  },
];

export const seedReturnRequests: ReturnRequestRecord[] = [
  {
    id: "RET-301",
    orderId: "SKX-1005",
    orderItemId: null,
    buyerName: demoBuyerName,
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerName: "Demo Atelier",
    sellerProfileId: "seller_profile_demo_atelier",
    productName: "Demo Atelier Long Coat",
    reason: "Size mismatch after first try-on",
    issueType: "Size and fit",
    photoProofLink: "https://placeholder.skxnz.local/returns/skx-1005-proof.jpg",
    message:
      "The fit feels narrower than expected in the shoulders, so this needs a return review.",
    status: "Requested",
    returnStatus: "Requested",
    refundStatus: "Not Connected in MVP",
    requestedAt: "Today, 09:30",
    resolvedAt: null,
    createdAt: "Today, 09:30",
    updatedAt: "Today, 09:30",
  },
  {
    id: "RET-298",
    orderId: "SKX-1004",
    orderItemId: null,
    buyerName: "Aarav M.",
    buyerProfileId: "buyer_profile_aarav",
    sellerName: "Chrome District",
    sellerProfileId: "seller_profile_chrome_district",
    productName: "Future Runner Crossbody",
    reason: "Magnetic flap alignment concern",
    issueType: "Quality issue",
    photoProofLink: "https://placeholder.skxnz.local/returns/skx-1004-proof.jpg",
    message:
      "Seeded return case retained for admin workflow review. Real pickups and refunds are not connected.",
    status: "Closed",
    returnStatus: "Closed",
    refundStatus: "Not Connected in MVP",
    requestedAt: "Yesterday, 13:42",
    resolvedAt: "Yesterday, 16:05",
    createdAt: "Yesterday, 13:42",
    updatedAt: "Yesterday, 16:05",
  },
];

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getOrderProgressIndex(status: OrderStatus) {
  if (status === "Cancelled") {
    return 0;
  }

  if (status === "Return Requested" || status === "Returned") {
    return orderStatusFlow.indexOf("Delivered");
  }

  const flowIndex = orderStatusFlow.indexOf(status as (typeof orderStatusFlow)[number]);

  return flowIndex === -1 ? 0 : flowIndex;
}

export function createOrderTimeline(order: MarketplaceOrder): OrderTimelineStep[] {
  const progressIndex = getOrderProgressIndex(order.orderStatus);

  const baseSteps: OrderTimelineStep[] = [
    {
      label: "Order Placed",
      detail: "Order created in mock marketplace state.",
      timestamp: order.createdAt,
      state: progressIndex >= 0 ? "complete" : "upcoming",
    },
    {
      label: "Seller Confirmation",
      detail: "Seller confirms the order before packing begins.",
      timestamp: order.updatedAt,
      state:
        progressIndex > 0
          ? "complete"
          : order.orderStatus === "Confirmed"
            ? "current"
            : "upcoming",
    },
    {
      label: "Packed",
      detail: "Packing placeholder for seller dispatch readiness.",
      timestamp: order.updatedAt,
      state:
        progressIndex > 1
          ? "complete"
          : order.orderStatus === "Packed"
            ? "current"
            : "upcoming",
    },
    {
      label: "Shipped",
      detail: "Carrier handoff is represented as mock-only lifecycle data.",
      timestamp: order.updatedAt,
      state:
        progressIndex > 2
          ? "complete"
          : order.orderStatus === "Shipped"
            ? "current"
            : "upcoming",
    },
    {
      label: "Delivered",
      detail: "Final delivery is a seeded state and not real-time tracking.",
      timestamp: order.updatedAt,
      state:
        progressIndex > 4
          ? "complete"
          : order.orderStatus === "Delivered" ||
              order.orderStatus === "Return Requested" ||
              order.orderStatus === "Returned"
            ? "current"
            : order.orderStatus === "Out for Delivery"
              ? "upcoming"
              : progressIndex >= 4
                ? "complete"
                : "upcoming",
    },
  ];

  const timeline: OrderTimelineStep[] =
    order.orderStatus === "Out for Delivery"
      ? baseSteps.map((step): OrderTimelineStep =>
          step.label === "Delivered"
            ? { ...step, state: "upcoming" }
            : step,
        )
      : baseSteps;

  if (order.orderStatus === "Cancelled") {
    timeline.push({
      label: "Cancelled",
      detail: "Cancellation is placeholder-only and not connected to refunds.",
      timestamp: order.updatedAt,
      state: "current",
    });
  }

  if (order.returnStatus !== "Not Requested") {
    timeline.push({
      label: "Return Requested",
      detail: "Buyer has opened a mock return request for review.",
      timestamp: order.updatedAt,
      state:
        order.returnStatus === "Requested" ? "current" : "complete",
    });
    timeline.push({
      label: "Return Review",
      detail: "Admin and seller review remains placeholder-only in the MVP.",
      timestamp: order.updatedAt,
      state:
        order.returnStatus === "Under Review" ||
        order.returnStatus === "Approved" ||
        order.returnStatus === "Rejected"
          ? "current"
          : order.returnStatus === "Picked Up" ||
              order.returnStatus === "Refunded" ||
              order.returnStatus === "Closed"
            ? "complete"
            : "upcoming",
    });
  }

  return timeline;
}

export const demoAccountOrdersStorageKey = "skxnz-demo-account-orders";

function createOrderTimestamp() {
  return new Date().toISOString();
}

export function getDemoOrderStatusLabel(status: DemoOrderStatus) {
  return status;
}

export function getDemoAccountOrders() {
  if (typeof window === "undefined") {
    return [] as DemoOrder[];
  }

  try {
    const storedValue = window.localStorage.getItem(demoAccountOrdersStorageKey);

    if (!storedValue) {
      return [] as DemoOrder[];
    }

    return JSON.parse(storedValue) as DemoOrder[];
  } catch {
    return [] as DemoOrder[];
  }
}

export function saveDemoAccountOrders(orders: DemoOrder[]) {
  const nextOrders = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      demoAccountOrdersStorageKey,
      JSON.stringify(nextOrders),
    );
  }

  return nextOrders;
}

export function mapCheckoutOrderToDemoOrder(
  checkoutOrder: DemoCheckoutOrder,
): DemoOrder {
  const now = createOrderTimestamp();
  const shippingAddress: Address = {
    id: `demo_checkout_address_${checkoutOrder.id}`,
    userId: demoBuyerUserId,
    label: "Checkout address",
    fullName: checkoutOrder.shipping.fullName,
    phoneNumber: checkoutOrder.shipping.phone,
    line1: checkoutOrder.shipping.address,
    line2: null,
    city: checkoutOrder.shipping.city,
    state: checkoutOrder.shipping.state,
    postalCode: checkoutOrder.shipping.pincode,
    country: "India",
    isDefault: false,
    createdAt: checkoutOrder.createdAt,
    updatedAt: now,
  };

  const items: DemoOrderItem[] = checkoutOrder.items.map((item) => {
    const unitPrice = item.product.salePrice ?? item.product.price;

    return {
      id: `demo_order_item_${checkoutOrder.id}_${item.product.id}`,
      productId: item.product.id,
      productName: item.product.name,
      brandName: item.product.brandName,
      image: item.image || item.product.image,
      selectedSize: item.size || null,
      selectedColor: item.color || null,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      currency: "INR",
    };
  });

  return {
    id: checkoutOrder.id,
    userId: demoBuyerUserId,
    status: "Demo placed",
    paymentLabel: checkoutOrder.paymentLabel,
    subtotal: checkoutOrder.subtotal,
    shippingEstimate: checkoutOrder.shippingEstimate,
    total: checkoutOrder.total,
    currency: "INR",
    shippingAddress,
    items,
    source: "demo-checkout",
    demoOnly: true,
    note: checkoutOrder.note,
    createdAt: checkoutOrder.createdAt,
    updatedAt: now,
  };
}

export function upsertDemoCheckoutOrder(
  checkoutOrder: DemoCheckoutOrder,
  currentOrders = getDemoAccountOrders(),
) {
  const mappedOrder = mapCheckoutOrderToDemoOrder(checkoutOrder);
  const withoutDuplicate = currentOrders.filter(
    (order) => order.id !== mappedOrder.id,
  );

  return saveDemoAccountOrders([mappedOrder, ...withoutDuplicate]);
}

export function createSeedDemoOrders(): DemoOrder[] {
  return seedOrders
    .filter((order) => order.buyerName === demoBuyerName)
    .slice(0, 3)
    .map((order, index) => {
      const createdAt =
        index === 0
          ? new Date().toISOString()
          : new Date(Date.now() - (index + 1) * 86400000).toISOString();

      return {
        id: `${order.id}-DEMO`,
        userId: demoBuyerUserId,
        status:
          index === 0
            ? "Demo processing"
            : index === 1
              ? "Demo shipped"
              : "Demo delivered",
        paymentLabel: "Demo payment placeholder",
        subtotal: order.amount,
        shippingEstimate: 0,
        total: order.amount,
        currency: "INR",
        shippingAddress: {
          id: `seed_address_${order.id}`,
          userId: demoBuyerUserId,
          label: "Seeded demo city",
          fullName: demoBuyerName,
          phoneNumber: "Not collected for seeded demo order",
          line1: "Internal demo address placeholder",
          line2: null,
          city: order.buyerCity,
          state: "Demo state",
          postalCode: "000000",
          country: "India",
          isDefault: false,
          createdAt,
          updatedAt: createdAt,
        },
        items: [
          {
            id: `seed_order_item_${order.id}`,
            productId: order.productId,
            productName: order.productName,
            brandName: order.sellerName,
            image: null,
            selectedSize: null,
            selectedColor: null,
            quantity: 1,
            unitPrice: order.amount,
            lineTotal: order.amount,
            currency: "INR",
          },
        ],
        source: "seed",
        demoOnly: true,
        note: "Seeded demo order. Real order history is not connected yet.",
        createdAt,
        updatedAt: createdAt,
      } satisfies DemoOrder;
    });
}

export function getAccountOrderHistory() {
  const storedOrders = getDemoAccountOrders();
  const seedDemoOrders = createSeedDemoOrders();
  const seenOrderIds = new Set(storedOrders.map((order) => order.id));

  return [...storedOrders, ...seedDemoOrders.filter((order) => !seenOrderIds.has(order.id))]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
