export type Metric = {
  name: string;
  value: string;
  trend: string;
  description: string;
};

type SellerProductRow = {
  product: string;
  category: string;
  price: string;
  stock: string;
  status: string;
  updatedAt: string;
};

type SellerInventoryRow = {
  sku: string;
  product: string;
  variant: string;
  stock: string;
  status: string;
  updatedAt: string;
};

type SellerOrderRow = {
  orderId: string;
  product: string;
  buyerCity: string;
  amount: string;
  orderStatus: string;
  dispatchStatus: string;
  createdAt: string;
};

type SellerApprovalRow = {
  brand: string;
  categoryFocus: string;
  status: string;
  submittedAt: string;
  note: string;
};

type ProductApprovalRow = {
  product: string;
  seller: string;
  category: string;
  status: string;
  submittedAt: string;
  note: string;
};

type AdminOrderRow = {
  orderId: string;
  buyer: string;
  seller: string;
  product: string;
  amount: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryStatus: string;
  updatedAt: string;
};

type SupportTicketRow = {
  ticketId: string;
  requester: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
};

const formatCount = (value: number) => value.toString().padStart(2, "0");

export const sellerProductRows: SellerProductRow[] = [
  {
    product: "Neutra X Hoodie",
    category: "Outerwear",
    price: "$248",
    stock: "24 units",
    status: "Approved",
    updatedAt: "Today, 09:15",
  },
  {
    product: "Aether Grid Cargo",
    category: "Bottoms",
    price: "$214",
    stock: "20 units",
    status: "Approved",
    updatedAt: "Today, 08:52",
  },
  {
    product: "Quantum Backpack",
    category: "Bags",
    price: "$334",
    stock: "12 units",
    status: "Pending Review",
    updatedAt: "Yesterday, 16:22",
  },
  {
    product: "Nova Signal Vest",
    category: "Vests",
    price: "$176",
    stock: "14 units",
    status: "Draft Placeholder",
    updatedAt: "Yesterday, 11:40",
  },
];

export const sellerInventoryRows: SellerInventoryRow[] = [
  {
    sku: "NXH-M-BLK",
    product: "Neutra X Hoodie",
    variant: "M / Obsidian Black",
    stock: "12",
    status: "Approved",
    updatedAt: "Today, 09:15",
  },
  {
    sku: "AGC-L-BLK",
    product: "Aether Grid Cargo",
    variant: "L / Obsidian Black",
    stock: "10",
    status: "Approved",
    updatedAt: "Today, 08:52",
  },
  {
    sku: "QB-18L-UV",
    product: "Quantum Backpack",
    variant: "18L / Ultraviolet Bronze",
    stock: "07",
    status: "Pending Review",
    updatedAt: "Yesterday, 16:22",
  },
  {
    sku: "NSV-L-BLK",
    product: "Nova Signal Vest",
    variant: "L / Obsidian Black",
    stock: "07",
    status: "Draft Placeholder",
    updatedAt: "Yesterday, 11:40",
  },
  {
    sku: "NXH-L-NVY",
    product: "Neutra X Hoodie",
    variant: "L / Midnight Navy",
    stock: "08",
    status: "Low Stock",
    updatedAt: "Yesterday, 09:06",
  },
];

export const sellerOrderRows: SellerOrderRow[] = [
  {
    orderId: "SKX-1008",
    product: "Neutra X Hoodie",
    buyerCity: "Mumbai",
    amount: "$248",
    orderStatus: "Confirmed",
    dispatchStatus: "Packed",
    createdAt: "Today, 10:24",
  },
  {
    orderId: "SKX-1007",
    product: "X-1 Signal Jacket",
    buyerCity: "Delhi",
    amount: "$382",
    orderStatus: "Pending",
    dispatchStatus: "Awaiting Dispatch",
    createdAt: "Today, 08:03",
  },
  {
    orderId: "SKX-1006",
    product: "Vortex Runners",
    buyerCity: "Bengaluru",
    amount: "$296",
    orderStatus: "Confirmed",
    dispatchStatus: "Dispatch Hold",
    createdAt: "Yesterday, 19:20",
  },
  {
    orderId: "SKX-1005",
    product: "Signal Flow Tee",
    buyerCity: "Pune",
    amount: "$118",
    orderStatus: "Shipped",
    dispatchStatus: "In Transit Placeholder",
    createdAt: "Yesterday, 17:46",
  },
  {
    orderId: "SKX-1004",
    product: "Quantum Backpack",
    buyerCity: "Hyderabad",
    amount: "$334",
    orderStatus: "Delivered",
    dispatchStatus: "Delivered Placeholder",
    createdAt: "Yesterday, 11:12",
  },
];

export const sellerApprovalRows: SellerApprovalRow[] = [
  {
    brand: "Noctra Lab",
    categoryFocus: "Tops / vests / accessories",
    status: "Pending Review",
    submittedAt: "Today, 09:40",
    note: "Awaiting final launch sequence sign-off and additional image coverage.",
  },
  {
    brand: "Signal Foundry",
    categoryFocus: "Technical jackets / accessories",
    status: "Approved",
    submittedAt: "Yesterday, 16:18",
    note: "Approved for the private MVP seller queue and hero assortment testing.",
  },
  {
    brand: "Vertex Atelier",
    categoryFocus: "Outerwear / bottoms / bags",
    status: "Approved",
    submittedAt: "Yesterday, 11:06",
    note: "Strong operational clarity and catalog structure for the private build.",
  },
];

export const productApprovalRows: ProductApprovalRow[] = [
  {
    product: "Quantum Backpack",
    seller: "Vertex Atelier",
    category: "Bags",
    status: "Pending Review",
    submittedAt: "Today, 08:10",
    note: "Needs more angle coverage before moving into the approved preview state.",
  },
  {
    product: "Chrome X Cap",
    seller: "Signal Foundry",
    category: "Accessories",
    status: "Pending Review",
    submittedAt: "Yesterday, 15:22",
    note: "Awaiting final hardware close-up and care note cleanup.",
  },
  {
    product: "Nova Signal Vest",
    seller: "Noctra Lab",
    category: "Vests",
    status: "Draft Placeholder",
    submittedAt: "Yesterday, 10:12",
    note: "Still in seller draft mode and not yet ready for moderation.",
  },
  {
    product: "Neutra X Hoodie",
    seller: "Vertex Atelier",
    category: "Outerwear",
    status: "Approved",
    submittedAt: "Monday, 17:51",
    note: "Approved for buyer browsing, cart testing, and order-flow demos.",
  },
];

export const adminOrderRows: AdminOrderRow[] = [
  {
    orderId: "SKX-1008",
    buyer: "Aarav M.",
    seller: "Vertex Atelier",
    product: "Neutra X Hoodie",
    amount: "$248",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
    deliveryStatus: "Packed",
    updatedAt: "Today, 10:24",
  },
  {
    orderId: "SKX-1007",
    buyer: "Rhea K.",
    seller: "Signal Foundry",
    product: "X-1 Signal Jacket",
    amount: "$382",
    paymentStatus: "Authorized Placeholder",
    orderStatus: "Pending",
    deliveryStatus: "Not Created",
    updatedAt: "Today, 08:03",
  },
  {
    orderId: "SKX-1006",
    buyer: "Kabir S.",
    seller: "Vertex Atelier",
    product: "Vortex Runners",
    amount: "$296",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
    deliveryStatus: "Dispatch Hold",
    updatedAt: "Yesterday, 19:20",
  },
  {
    orderId: "SKX-1005",
    buyer: "Anika T.",
    seller: "Noctra Lab",
    product: "Signal Flow Tee",
    amount: "$118",
    paymentStatus: "Captured Placeholder",
    orderStatus: "Shipped",
    deliveryStatus: "In Transit Placeholder",
    updatedAt: "Yesterday, 17:46",
  },
  {
    orderId: "SKX-1004",
    buyer: "Aarav M.",
    seller: "Vertex Atelier",
    product: "Quantum Backpack",
    amount: "$334",
    paymentStatus: "Captured Placeholder",
    orderStatus: "Delivered",
    deliveryStatus: "Delivered Placeholder",
    updatedAt: "Yesterday, 11:12",
  },
];

export const supportTicketRows: SupportTicketRow[] = [
  {
    ticketId: "SUP-204",
    requester: "Buyer",
    subject: "Need size guidance for Vortex Runners",
    status: "Open",
    priority: "Medium",
    updatedAt: "Today, 10:05",
  },
  {
    ticketId: "SUP-201",
    requester: "Seller",
    subject: "Question about product image approval",
    status: "In Progress",
    priority: "High",
    updatedAt: "Today, 09:12",
  },
  {
    ticketId: "SUP-196",
    requester: "Buyer",
    subject: "Waitlist confirmation email placeholder",
    status: "Resolved",
    priority: "Low",
    updatedAt: "Yesterday, 18:47",
  },
];

const sellerApprovedCount = sellerProductRows.filter(
  (row) => row.status === "Approved",
).length;
const sellerPendingCount = sellerProductRows.filter(
  (row) => row.status !== "Approved",
).length;
const sellerOrdersTodayCount = sellerOrderRows.filter((row) =>
  row.createdAt.startsWith("Today"),
).length;

export const sellerDashboardMetrics: Metric[] = [
  {
    name: "Total Products",
    value: formatCount(sellerProductRows.length),
    trend: "Catalog",
    description: "Mock products currently staged inside the seller workspace.",
  },
  {
    name: "Pending Products",
    value: formatCount(sellerPendingCount),
    trend: "Queue",
    description: "Listings still in draft or waiting for admin moderation.",
  },
  {
    name: "Approved Products",
    value: formatCount(sellerApprovedCount),
    trend: "Live Preview",
    description: "Products already cleared for buyer-side preview in the MVP.",
  },
  {
    name: "Orders Today",
    value: formatCount(sellerOrdersTodayCount),
    trend: "Today",
    description: "Read-only sample orders visible to the current seller workspace.",
  },
  {
    name: "Revenue Placeholder",
    value: "$1.68K",
    trend: "Mock",
    description: "Seeded order value preview only. No live payments or payouts are active.",
  },
];

const pendingSellerCount = sellerApprovalRows.filter(
  (row) => row.status === "Pending Review",
).length;
const pendingProductCount = productApprovalRows.filter(
  (row) => row.status !== "Approved",
).length;
const openSupportCount = supportTicketRows.filter(
  (row) => row.status !== "Resolved",
).length;

export const adminDashboardMetrics: Metric[] = [
  {
    name: "Pending Sellers",
    value: formatCount(pendingSellerCount),
    trend: "Review",
    description: "Seller applications still waiting on a final moderation decision.",
  },
  {
    name: "Pending Products",
    value: formatCount(pendingProductCount),
    trend: "Moderation",
    description: "Products still sitting in review or draft placeholder states.",
  },
  {
    name: "Total Orders",
    value: formatCount(adminOrderRows.length),
    trend: "Ops",
    description: "Seeded marketplace orders visible for status and workflow review.",
  },
  {
    name: "Open Support Tickets",
    value: formatCount(openSupportCount),
    trend: "Support",
    description: "Buyer and seller issues still open inside the private MVP queue.",
  },
];

export const auditHighlights = [
  "Seller, product, and order actions remain manual until auth and database writes are connected.",
  "Payments, delivery APIs, and AI generation stay disabled in this private MVP.",
  "The dashboard language here is meant to validate workflow clarity before deeper integrations.",
];
