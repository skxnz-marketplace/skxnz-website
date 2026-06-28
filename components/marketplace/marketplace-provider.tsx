"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyDemoProductMedia,
  createProductIdFromName,
  deriveProductFacets,
  fallbackProductImage,
  isApprovedProduct,
  legacyProductIdAliases,
  products as seedProducts,
  type CartPreviewItem,
  type Product,
  type ProductStatus,
  type ProductSubmissionInput,
} from "@/lib/data/products";
import {
  demoBuyerName,
  orderStatusFlow,
  seedOrders,
  seedReturnRequests,
  type AdminOrderActionState,
  type MarketplaceOrder,
  type OrderStatus,
  type ReturnRequestInput,
  type ReturnRequestRecord,
} from "@/lib/data/orders";

const productsStorageKey = "skxnz-marketplace-products";
const cartStorageKey = "skxnz-marketplace-cart";
const wishlistStorageKey = "skxnz-marketplace-wishlist";
const supportStorageKey = "skxnz-marketplace-support";
const sellerApplicationsStorageKey = "skxnz-marketplace-seller-applications";
const ordersStorageKey = "skxnz-marketplace-orders";
const returnsStorageKey = "skxnz-marketplace-returns";

const gradientOptions = [
  "from-sangria/20 via-transparent to-wine/20",
  "from-warmivory via-transparent to-sandstone/35",
  "from-wine/20 via-transparent to-sangria/20",
  "from-sangria/10 via-transparent to-warmivory",
];

const seedSupportTickets = [
  {
    id: "SUP-204",
    userId: "user_buyer_demo",
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerProfileId: null,
    assignedAdminUserId: "admin_user_01",
    userType: "Buyer" as const,
    requesterRole: "BUYER" as const,
    name: "Demo Buyer",
    contact: "demo-buyer@skxnz.local",
    subject: "Sizing guidance",
    issueType: "Sizing guidance",
    orderId: "SKX-1008",
    message: "Need help deciding between M and L for the Neutra X Hoodie.",
    priority: "Medium" as const,
    status: "Open" as const,
    createdAt: "Today, 10:05",
    updatedAt: "Today, 10:05",
  },
  {
    id: "SUP-201",
    userId: "user_seller_noctra",
    buyerProfileId: null,
    sellerProfileId: "seller_profile_noctra",
    assignedAdminUserId: "admin_user_01",
    userType: "Seller" as const,
    requesterRole: "SELLER" as const,
    name: "Noctra Lab",
    contact: "ops@noctralab.local",
    subject: "Product approval question",
    issueType: "Product approval question",
    orderId: "",
    message: "Checking what image angle coverage is still needed before approval.",
    priority: "High" as const,
    status: "In Progress" as const,
    createdAt: "Today, 09:12",
    updatedAt: "Today, 09:12",
  },
  {
    id: "SUP-196",
    userId: "user_buyer_demo",
    buyerProfileId: "buyer_profile_demo_buyer",
    sellerProfileId: null,
    assignedAdminUserId: "admin_user_01",
    userType: "Buyer" as const,
    requesterRole: "BUYER" as const,
    name: "Demo Buyer",
    contact: "demo-buyer@skxnz.local",
    subject: "Waitlist confirmation",
    issueType: "Waitlist confirmation",
    orderId: "",
    message: "Wanted to confirm whether the waitlist flow is still placeholder-only.",
    priority: "Low" as const,
    status: "Resolved" as const,
    createdAt: "Yesterday, 18:47",
    updatedAt: "Yesterday, 18:47",
  },
];

type AddToCartInput = {
  productId: string;
  size: string;
  color: string;
  quantity?: number;
};

type CreateSupportTicketInput = {
  name: string;
  contact: string;
  userType: "Buyer" | "Seller";
  issueType: string;
  orderId?: string;
  message: string;
};

export type SupportTicketRecord = {
  id: string;
  userId: string;
  buyerProfileId: string | null;
  sellerProfileId: string | null;
  assignedAdminUserId: string | null;
  userType: "Buyer" | "Seller";
  requesterRole: "BUYER" | "SELLER";
  name: string;
  contact: string;
  subject: string;
  issueType: string;
  orderId: string;
  message: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  updatedAt: string;
};

export type SellerApplicationStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "Needs More Info";

type SellerReviewChecklistItem = {
  label: string;
  complete: boolean;
};

export type SellerApplicationInput = {
  storeName: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  instagramPage: string;
  city: string;
  productCategory: string;
  productCount: number;
  gstAvailable: boolean;
  canShipOrders: boolean;
  productPhotoLink: string;
  priceRange: string;
  notes: string;
};

export type SellerApplicationRecord = SellerApplicationInput & {
  id: string;
  userId: string;
  sellerProfileId: string;
  brandName: string;
  status: SellerApplicationStatus;
  applicationNote: string;
  approvedAt: string | null;
  riskNote: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  reviewChecklist: SellerReviewChecklistItem[];
};

type SellerChecklistState = {
  productPhotosShared: boolean;
  contactDetailsComplete: boolean;
  shippingAbilityConfirmed: boolean;
  gstStatusChecked: boolean;
  categorySuitable: boolean;
  brandQualityAcceptable: boolean;
};

function createSellerChecklistItems(
  state: SellerChecklistState,
): SellerReviewChecklistItem[] {
  return [
    {
      label: "Product photos shared",
      complete: state.productPhotosShared,
    },
    {
      label: "Contact details complete",
      complete: state.contactDetailsComplete,
    },
    {
      label: "Shipping ability confirmed",
      complete: state.shippingAbilityConfirmed,
    },
    {
      label: "GST status checked",
      complete: state.gstStatusChecked,
    },
    {
      label: "Category suitable for SKXNZ",
      complete: state.categorySuitable,
    },
    {
      label: "Brand quality acceptable",
      complete: state.brandQualityAcceptable,
    },
  ];
}

const seedSellerApplications: SellerApplicationRecord[] = [
  {
    id: "SELL-412",
    userId: "user_seller_demo",
    sellerProfileId: "seller_profile_demo_seller_studio",
    brandName: "Demo Seller Studio",
    storeName: "Demo Seller Studio",
    ownerName: "Vivaan Poddar",
    phoneNumber: "+91 98765 12001",
    email: "demo-seller@skxnz.local",
    instagramPage: "@demosellerstudio",
    city: "Mumbai",
    productCategory: "Technical jackets / layered tops",
    productCount: 12,
    gstAvailable: true,
    canShipOrders: true,
    productPhotoLink:
      "https://placeholder.skxnz.local/sellers/demo-seller-studio.jpg",
    priceRange: "$160 - $320",
    notes:
      "Private capsule prepared for SKXNZ MVP review before real seller onboarding goes live.",
    status: "Pending Review",
    applicationNote:
      "Private capsule prepared for SKXNZ MVP review before real seller onboarding goes live.",
    approvedAt: null,
    riskNote:
      "Awaiting final product photo coverage and brand-quality review before approval.",
    submittedAt: "Today, 11:08",
    createdAt: "2026-04-30T11:08:00.000Z",
    updatedAt: "2026-04-30T11:08:00.000Z",
    reviewChecklist: createSellerChecklistItems({
      productPhotosShared: true,
      contactDetailsComplete: true,
      shippingAbilityConfirmed: true,
      gstStatusChecked: true,
      categorySuitable: false,
      brandQualityAcceptable: false,
    }),
  },
  {
    id: "SELL-401",
    userId: "user_seller_signal",
    sellerProfileId: "seller_profile_signal",
    brandName: "Signal Foundry",
    storeName: "Signal Foundry",
    ownerName: "Aarav Mehta",
    phoneNumber: "+91 98980 42011",
    email: "ops@signalfoundry.local",
    instagramPage: "@signalfoundry",
    city: "Delhi",
    productCategory: "Technical jackets / accessories",
    productCount: 18,
    gstAvailable: true,
    canShipOrders: true,
    productPhotoLink:
      "https://placeholder.skxnz.local/sellers/signal-foundry.jpg",
    priceRange: "$190 - $410",
    notes:
      "Structured premium assortment aligned to SKXNZ launch styling and clean fulfillment handling.",
    status: "Approved",
    applicationNote:
      "Structured premium assortment aligned to SKXNZ launch styling and clean fulfillment handling.",
    approvedAt: "2026-04-29T16:18:00.000Z",
    riskNote:
      "Approved for private MVP seller onboarding. Real payouts and live seller account activation remain off.",
    submittedAt: "Yesterday, 16:18",
    createdAt: "2026-04-29T16:18:00.000Z",
    updatedAt: "2026-04-29T16:18:00.000Z",
    reviewChecklist: createSellerChecklistItems({
      productPhotosShared: true,
      contactDetailsComplete: true,
      shippingAbilityConfirmed: true,
      gstStatusChecked: true,
      categorySuitable: true,
      brandQualityAcceptable: true,
    }),
  },
  {
    id: "SELL-397",
    userId: "user_seller_noctra",
    sellerProfileId: "seller_profile_noctra",
    brandName: "Noctra Lab",
    storeName: "Noctra Lab",
    ownerName: "Rhea Kapoor",
    phoneNumber: "+91 98110 22034",
    email: "studio@noctralab.local",
    instagramPage: "@noctralab",
    city: "Bengaluru",
    productCategory: "Tops / vests / accessories",
    productCount: 9,
    gstAvailable: true,
    canShipOrders: true,
    productPhotoLink: "https://placeholder.skxnz.local/sellers/noctra-lab.jpg",
    priceRange: "$120 - $280",
    notes:
      "Strong visual direction, but the current application still needs cleaner close-up product detail coverage.",
    status: "Needs More Info",
    applicationNote:
      "Strong visual direction, but the current application still needs cleaner close-up product detail coverage.",
    approvedAt: null,
    riskNote:
      "Need more image angles and clearer material detail before seller approval can continue.",
    submittedAt: "Yesterday, 09:54",
    createdAt: "2026-04-29T09:54:00.000Z",
    updatedAt: "2026-04-29T09:54:00.000Z",
    reviewChecklist: createSellerChecklistItems({
      productPhotosShared: false,
      contactDetailsComplete: true,
      shippingAbilityConfirmed: true,
      gstStatusChecked: true,
      categorySuitable: true,
      brandQualityAcceptable: false,
    }),
  },
  {
    id: "SELL-389",
    userId: "user_seller_pulse_array",
    sellerProfileId: "seller_profile_pulse_array",
    brandName: "Pulse Array",
    storeName: "Pulse Array",
    ownerName: "Kabir Shah",
    phoneNumber: "+91 98200 11017",
    email: "hello@pulsearray.local",
    instagramPage: "@pulsearray",
    city: "Pune",
    productCategory: "Graphic streetwear / basics",
    productCount: 6,
    gstAvailable: false,
    canShipOrders: false,
    productPhotoLink: "https://placeholder.skxnz.local/sellers/pulse-array.jpg",
    priceRange: "$60 - $110",
    notes:
      "Brand concept is early and not yet aligned to the premium futurewear direction set for SKXNZ.",
    status: "Rejected",
    applicationNote:
      "Brand concept is early and not yet aligned to the premium futurewear direction set for SKXNZ.",
    approvedAt: null,
    riskNote:
      "Current assortment direction and operations readiness do not fit the private SKXNZ launch bar yet.",
    submittedAt: "Monday, 14:26",
    createdAt: "2026-04-28T14:26:00.000Z",
    updatedAt: "2026-04-28T14:26:00.000Z",
    reviewChecklist: createSellerChecklistItems({
      productPhotosShared: true,
      contactDetailsComplete: true,
      shippingAbilityConfirmed: false,
      gstStatusChecked: true,
      categorySuitable: false,
      brandQualityAcceptable: false,
    }),
  },
];

type MarketplaceContextValue = {
  catalog: Product[];
  approvedProducts: Product[];
  pendingReviewProducts: Product[];
  rejectedProducts: Product[];
  draftProducts: Product[];
  orders: MarketplaceOrder[];
  buyerOrders: MarketplaceOrder[];
  returnRequests: ReturnRequestRecord[];
  cartItems: CartPreviewItem[];
  wishlistProducts: Product[];
  supportTickets: SupportTicketRecord[];
  sellerApplications: SellerApplicationRecord[];
  latestSellerApplication: SellerApplicationRecord | undefined;
  isHydrated: boolean;
  submitProduct: (input: ProductSubmissionInput) => Product;
  updateProductStatus: (productId: string, status: ProductStatus) => void;
  submitSellerApplication: (
    input: SellerApplicationInput,
  ) => SellerApplicationRecord;
  updateSellerApplicationStatus: (
    sellerId: string,
    status: SellerApplicationStatus,
  ) => void;
  advanceOrderStatus: (orderId: string) => void;
  setAdminOrderActionState: (
    orderId: string,
    actionState: AdminOrderActionState,
  ) => void;
  createReturnRequest: (
    input: ReturnRequestInput,
  ) => ReturnRequestRecord | null;
  addToCart: (input: AddToCartInput) => { ok: boolean; message: string };
  updateCartQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  moveWishlistItemToCart: (productId: string) => { ok: boolean; message: string };
  isInWishlist: (productId: string) => boolean;
  createSupportTicket: (input: CreateSupportTicketInput) => SupportTicketRecord;
  getProductById: (productId: string) => Product | undefined;
  getOrderById: (orderId: string) => MarketplaceOrder | undefined;
  approvedFacets: {
    categories: string[];
    sizes: string[];
    colors: string[];
  };
};

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

type MarketplaceProviderProps = {
  children: ReactNode;
};

function createTimestampLabel() {
  const now = new Date();

  return `Today, ${now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function createIsoTimestamp() {
  return new Date().toISOString();
}

function pickGradient(index: number) {
  return gradientOptions[index % gradientOptions.length];
}

function createUniqueProductId(name: string, collection: Product[]) {
  const baseId =
    createProductIdFromName(name) || `skxnz-product-${collection.length + 1}`;
  let candidate = baseId;
  let suffix = 2;

  while (collection.some((product) => product.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildSubmittedProduct(
  input: ProductSubmissionInput,
  collection: Product[],
): Product {
  const primaryColor = input.colors[0] ?? "Electric Teal";
  const normalizedDescription = input.description.trim();
  const normalizedTags =
    input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];

  return applyDemoProductMedia({
    id: createUniqueProductId(input.name, collection),
    slug: createProductIdFromName(input.name),
    sellerProfileId: "seller_profile_demo_seller_studio",
    categoryId: `category_${input.category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    brandId: "brand-demo-seller-studio",
    brandSlug: "demo-seller-studio",
    brandName: "Demo Seller Studio",
    name: input.name.trim(),
    shortDescription: `${input.fit.trim()} ${input.category.trim().toLowerCase()} shaped for SKXNZ review.`,
    price: input.price,
    priceCents: input.price * 100,
    salePrice: input.salePrice,
    category: input.category.trim(),
    subcategory: input.category.trim(),
    subtitle: `${input.fit.trim()} ${input.category
      .trim()
      .toLowerCase()} shaped for SKXNZ review.`,
    description: normalizedDescription,
    gradient: pickGradient(collection.length),
    accent: primaryColor,
    seller: "Demo Seller Studio",
    deliveryWindow: "Delivery placeholder pending checkout and operations launch.",
    features: [
      `${input.fit.trim()} fit prepared for buyer preview.`,
      `${input.fabric.trim()} construction highlighted for admin moderation.`,
      "Submitted from the seller workspace for SKXNZ review.",
    ],
    materials: [
      input.fabric.trim(),
      `${input.fit.trim()} fit structure`,
      "Image URL placeholder captured for future media review.",
    ],
    sizes: input.sizes,
    colors: input.colors,
    stock: input.stock,
    inventoryCount: input.stock,
    status: "Pending Review",
    launchNote: "Submitted from the seller workspace for SKXNZ admin review.",
    fabric: input.fabric.trim(),
    fit: input.fit.trim(),
    tags:
      normalizedTags.length > 0
        ? normalizedTags
        : [
            input.category.trim(),
            input.fit.trim(),
            ...input.colors.map((color) => color.trim()),
          ],
    collections: ["Seller Submission"],
    searchAliases: [input.description.trim()],
    imageUrl: input.imageUrl.trim(),
    submittedAt: createTimestampLabel(),
    createdAt: createIsoTimestamp(),
    updatedAt: createIsoTimestamp(),
  });
}

function readStoredValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser-local persistence is best-effort in the private MVP.
  }
}

function normalizeStoredProduct(
  product: Partial<Product> & { id: string; brand?: string },
) {
  const resolvedProductId = legacyProductIdAliases[product.id] ?? product.id;
  const seedMatch = seedProducts.find(
    (seedProduct) => seedProduct.id === resolvedProductId,
  );
  const resolvedBrandSlug = product.brandSlug ?? seedMatch?.brandSlug ?? "skxnz";
  const resolvedBrandName =
    product.brandName ?? product.brand ?? seedMatch?.brandName ?? "SKXNZ";
  const resolvedBrandId =
    product.brandId ?? seedMatch?.brandId ?? `brand-${resolvedBrandSlug}`;
  const normalizedProduct = {
    ...(seedMatch ?? product),
    ...product,
    id: resolvedProductId,
    slug: product.slug ?? seedMatch?.slug ?? resolvedProductId,
    brandId: resolvedBrandId,
    brandSlug: resolvedBrandSlug,
    brandName: resolvedBrandName,
    subcategory: product.subcategory ?? seedMatch?.subcategory ?? product.category ?? "Product",
    image: product.image ?? seedMatch?.image ?? fallbackProductImage,
    gallery:
      product.gallery?.length
        ? product.gallery
        : seedMatch?.gallery ?? [fallbackProductImage],
    tags: product.tags ?? seedMatch?.tags ?? [],
    collections: product.collections ?? seedMatch?.collections ?? [],
    searchAliases: product.searchAliases ?? seedMatch?.searchAliases ?? [],
    imageUrl:
      product.imageUrl ?? seedMatch?.imageUrl ?? product.image ?? fallbackProductImage,
  } as Product;

  return applyDemoProductMedia(normalizedProduct);
}

function normalizeStoredCartItems(items: CartPreviewItem[]) {
  return items.map((item) => {
    const seedMatch = seedProducts.find(
      (seedProduct) => seedProduct.id === (legacyProductIdAliases[item.productId] ?? item.productId),
    );
    const normalizedProduct = normalizeStoredProduct({
      ...(seedMatch ?? {}),
      ...item.product,
    });

    return {
      ...item,
      productId: normalizedProduct.id,
      product: normalizedProduct,
      image: item.image ?? normalizedProduct.image,
    };
  });
}

function normalizeStoredOrders(items: MarketplaceOrder[]) {
  return items.map((item) => ({
    ...item,
    productId: legacyProductIdAliases[item.productId] ?? item.productId,
  }));
}

function normalizeStoredWishlistIds(items: string[]) {
  return items.map((item) => legacyProductIdAliases[item] ?? item);
}

function createSupportPriority(issueType: string) {
  const normalized = issueType.toLowerCase();

  if (
    normalized.includes("order") ||
    normalized.includes("delivery") ||
    normalized.includes("approval")
  ) {
    return "High" as const;
  }

  if (normalized.includes("size") || normalized.includes("return")) {
    return "Medium" as const;
  }

  return "Low" as const;
}

function createNextSupportId(collection: SupportTicketRecord[]) {
  const highestValue = collection.reduce((highest, ticket) => {
    const numericPart = Number(ticket.id.replace("SUP-", ""));

    return Number.isFinite(numericPart) ? Math.max(highest, numericPart) : highest;
  }, 195);

  return `SUP-${highestValue + 1}`;
}

function createNextSellerId(collection: SellerApplicationRecord[]) {
  const highestValue = collection.reduce((highest, application) => {
    const numericPart = Number(application.id.replace("SELL-", ""));

    return Number.isFinite(numericPart)
      ? Math.max(highest, numericPart)
      : highest;
  }, 388);

  return `SELL-${highestValue + 1}`;
}

function createSellerRiskNote(
  status: SellerApplicationStatus,
  input?: SellerApplicationInput,
) {
  if (status === "Approved") {
    return "Approved for private MVP seller onboarding. Real payouts and live seller account activation remain off.";
  }

  if (status === "Rejected") {
    return "Rejected in the MVP seller review queue. Refine brand fit, product quality, or operations readiness before resubmitting.";
  }

  if (status === "Needs More Info") {
    return "More seller information is needed before approval. Product photos, shipping readiness, or brand details should be clarified.";
  }

  if (!input) {
    return "Awaiting SKXNZ admin review for brand fit, product quality, and operations readiness.";
  }

  if (!input.canShipOrders) {
    return "Shipping ability is not yet confirmed, so operations review is required before approval.";
  }

  if (!input.gstAvailable) {
    return "GST availability needs manual review before onboarding can continue.";
  }

  if (input.productCount < 8) {
    return "Initial product depth is light, so the assortment needs closer review before approval.";
  }

  return "Awaiting SKXNZ admin review for brand fit, product quality, and operations readiness.";
}

function buildSubmittedSellerApplication(
  input: SellerApplicationInput,
  collection: SellerApplicationRecord[],
): SellerApplicationRecord {
  const contactDetailsComplete = Boolean(
    input.ownerName.trim() &&
      input.phoneNumber.trim() &&
      input.email.trim() &&
      input.city.trim(),
  );

  return {
    id: createNextSellerId(collection),
    userId: `user_${input.storeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")}`,
    sellerProfileId: `seller_profile_${input.storeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")}`,
    brandName: input.storeName.trim(),
    storeName: input.storeName.trim(),
    ownerName: input.ownerName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    email: input.email.trim(),
    instagramPage: input.instagramPage.trim(),
    city: input.city.trim(),
    productCategory: input.productCategory.trim(),
    productCount: input.productCount,
    gstAvailable: input.gstAvailable,
    canShipOrders: input.canShipOrders,
    productPhotoLink: input.productPhotoLink.trim(),
    priceRange: input.priceRange.trim(),
    notes: input.notes.trim(),
    status: "Pending Review",
    applicationNote: input.notes.trim(),
    approvedAt: null,
    riskNote: createSellerRiskNote("Pending Review", input),
    submittedAt: createTimestampLabel(),
    createdAt: createIsoTimestamp(),
    updatedAt: createIsoTimestamp(),
    reviewChecklist: createSellerChecklistItems({
      productPhotosShared: Boolean(input.productPhotoLink.trim()),
      contactDetailsComplete,
      shippingAbilityConfirmed: input.canShipOrders,
      gstStatusChecked: true,
      categorySuitable: false,
      brandQualityAcceptable: false,
    }),
  };
}

function applySellerStatusChecklist(
  checklist: SellerReviewChecklistItem[],
  status: SellerApplicationStatus,
) {
  if (status === "Approved") {
    return checklist.map((item) =>
      item.label === "Category suitable for SKXNZ" ||
      item.label === "Brand quality acceptable"
        ? { ...item, complete: true }
        : item,
    );
  }

  if (status === "Rejected") {
    return checklist.map((item) =>
      item.label === "Category suitable for SKXNZ" ||
      item.label === "Brand quality acceptable"
        ? { ...item, complete: false }
        : item,
    );
  }

  return checklist;
}

function createNextReturnId(collection: ReturnRequestRecord[]) {
  const highestValue = collection.reduce((highest, request) => {
    const numericPart = Number(request.id.replace("RET-", ""));

    return Number.isFinite(numericPart)
      ? Math.max(highest, numericPart)
      : highest;
  }, 297);

  return `RET-${highestValue + 1}`;
}

function getNextOrderStatus(current: OrderStatus) {
  if (current === "Cancelled" || current === "Returned") {
    return current;
  }

  if (current === "Return Requested") {
    return "Returned" as const;
  }

  const currentIndex = orderStatusFlow.indexOf(current as (typeof orderStatusFlow)[number]);

  if (currentIndex === -1 || currentIndex === orderStatusFlow.length - 1) {
    return current;
  }

  return orderStatusFlow[currentIndex + 1];
}

function deriveDeliveryStatusFromOrder(status: OrderStatus) {
  if (status === "Placed" || status === "Confirmed") {
    return "Pickup Pending" as const;
  }

  if (status === "Packed") {
    return "Pickup Pending" as const;
  }

  if (status === "Shipped") {
    return "In Transit" as const;
  }

  if (status === "Out for Delivery") {
    return "Out for Delivery" as const;
  }

  if (status === "Delivered" || status === "Return Requested" || status === "Returned") {
    return "Delivered" as const;
  }

  return "Not Assigned" as const;
}

function deriveDispatchStatusFromOrder(status: OrderStatus) {
  if (status === "Placed") {
    return "Not Assigned";
  }

  if (status === "Confirmed") {
    return "Awaiting Dispatch";
  }

  if (status === "Packed") {
    return "Packed";
  }

  if (status === "Shipped" || status === "Out for Delivery") {
    return "Picked Up";
  }

  if (status === "Delivered" || status === "Return Requested" || status === "Returned") {
    return "Delivered";
  }

  return "Dispatch Placeholder";
}

function deriveReturnStatusFromOrder(status: OrderStatus, current: ReturnRequestRecord["returnStatus"]) {
  if (status === "Return Requested") {
    return "Requested" as const;
  }

  if (status === "Returned") {
    return "Closed" as const;
  }

  return current;
}

export function MarketplaceProvider({ children }: MarketplaceProviderProps) {
  const [catalog, setCatalog] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<MarketplaceOrder[]>(seedOrders);
  const [returnRequests, setReturnRequests] =
    useState<ReturnRequestRecord[]>(seedReturnRequests);
  const [cartItems, setCartItems] = useState<CartPreviewItem[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [supportTickets, setSupportTickets] =
    useState<SupportTicketRecord[]>(seedSupportTickets);
  const [sellerApplications, setSellerApplications] =
    useState<SellerApplicationRecord[]>(seedSellerApplications);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setCatalog(
      readStoredValue(productsStorageKey, seedProducts).map(normalizeStoredProduct),
    );
    setOrders(normalizeStoredOrders(readStoredValue(ordersStorageKey, seedOrders)));
    setReturnRequests(readStoredValue(returnsStorageKey, seedReturnRequests));
    setCartItems(normalizeStoredCartItems(readStoredValue(cartStorageKey, [])));
    setWishlistProductIds(
      normalizeStoredWishlistIds(readStoredValue(wishlistStorageKey, [])),
    );
    setSupportTickets(readStoredValue(supportStorageKey, seedSupportTickets));
    setSellerApplications(
      readStoredValue(sellerApplicationsStorageKey, seedSellerApplications),
    );
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(productsStorageKey, JSON.stringify(catalog));
  }, [catalog, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
  }, [isHydrated, orders]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      returnsStorageKey,
      JSON.stringify(returnRequests),
    );
  }, [isHydrated, returnRequests]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  }, [cartItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      wishlistStorageKey,
      JSON.stringify(wishlistProductIds),
    );
  }, [isHydrated, wishlistProductIds]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      supportStorageKey,
      JSON.stringify(supportTickets),
    );
  }, [isHydrated, supportTickets]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      sellerApplicationsStorageKey,
      JSON.stringify(sellerApplications),
    );
  }, [isHydrated, sellerApplications]);

  const approvedProducts = useMemo(
    () => catalog.filter((product) => product.status === "Approved Preview"),
    [catalog],
  );
  const pendingReviewProducts = useMemo(
    () => catalog.filter((product) => product.status === "Pending Review"),
    [catalog],
  );
  const rejectedProducts = useMemo(
    () => catalog.filter((product) => product.status === "Rejected Review"),
    [catalog],
  );
  const draftProducts = useMemo(
    () => catalog.filter((product) => product.status === "Draft Placeholder"),
    [catalog],
  );
  const approvedFacets = useMemo(
    () => deriveProductFacets(approvedProducts),
    [approvedProducts],
  );
  const wishlistProducts = useMemo(
    () =>
      wishlistProductIds
        .map((productId) => catalog.find((product) => product.id === productId))
        .filter((product): product is Product => Boolean(product)),
    [catalog, wishlistProductIds],
  );
  const buyerOrders = useMemo(
    () => orders.filter((order) => order.buyerName === demoBuyerName),
    [orders],
  );
  const latestSellerApplication = sellerApplications[0];

  function submitProduct(input: ProductSubmissionInput) {
    const nextProduct = buildSubmittedProduct(input, catalog);

    setCatalog((current) => [nextProduct, ...current]);

    return nextProduct;
  }

  function updateProductStatus(productId: string, status: ProductStatus) {
    setCatalog((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, status } : product,
      ),
    );
  }

  function submitSellerApplication(input: SellerApplicationInput) {
    const nextApplication = buildSubmittedSellerApplication(
      input,
      sellerApplications,
    );

    setSellerApplications((current) => [nextApplication, ...current]);

    return nextApplication;
  }

  function updateSellerApplicationStatus(
    sellerId: string,
    status: SellerApplicationStatus,
  ) {
    setSellerApplications((current) =>
      current.map((application) =>
        application.id === sellerId
          ? {
              ...application,
              status,
              approvedAt:
                status === "Approved" ? createIsoTimestamp() : application.approvedAt,
              riskNote: createSellerRiskNote(status),
              updatedAt: createIsoTimestamp(),
              reviewChecklist: applySellerStatusChecklist(
                application.reviewChecklist,
                status,
              ),
            }
          : application,
      ),
    );
  }

  function advanceOrderStatus(orderId: string) {
    let nextStatusForOrder: OrderStatus | null = null;

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        const nextStatus = getNextOrderStatus(order.orderStatus);
        nextStatusForOrder = nextStatus;

        return {
          ...order,
          orderStatus: nextStatus,
          deliveryStatus: deriveDeliveryStatusFromOrder(nextStatus),
          dispatchStatus: deriveDispatchStatusFromOrder(nextStatus),
          returnStatus: deriveReturnStatusFromOrder(nextStatus, order.returnStatus),
          updatedAt: createTimestampLabel(),
          returnNote:
            nextStatus === "Returned"
              ? "Return flow remains placeholder-only. Pickup and refunds are not connected."
              : order.returnNote,
        };
      }),
    );

    if (nextStatusForOrder === "Returned") {
      setReturnRequests((current) =>
        current.map((request) =>
          request.orderId === orderId
            ? {
                ...request,
                status: "Closed",
                returnStatus: "Closed",
                refundStatus: "Not Connected in MVP",
                resolvedAt: createTimestampLabel(),
                updatedAt: createTimestampLabel(),
              }
            : request,
        ),
      );
    }
  }

  function setAdminOrderActionState(
    orderId: string,
    actionState: AdminOrderActionState,
  ) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              adminActionState: actionState,
              updatedAt: createTimestampLabel(),
              paymentStatus:
                actionState === "Refund Placeholder"
                  ? "Not Connected in MVP"
                  : order.paymentStatus,
            }
          : order,
      ),
    );
  }

  function createReturnRequest(input: ReturnRequestInput) {
    const matchedOrder = orders.find((order) => order.id === input.orderId.trim());

    if (!matchedOrder) {
      return null;
    }

    const nextRequest: ReturnRequestRecord = {
      id: createNextReturnId(returnRequests),
      orderId: matchedOrder.id,
      orderItemId: null,
      buyerName: matchedOrder.buyerName,
      buyerProfileId: matchedOrder.buyerProfileId,
      sellerName: matchedOrder.sellerName,
      sellerProfileId: matchedOrder.sellerProfileId,
      productName: input.productName.trim(),
      reason: input.reason.trim(),
      issueType: input.issueType.trim(),
      photoProofLink: input.photoProofLink.trim(),
      message: input.message.trim(),
      status: "Requested",
      returnStatus: "Requested",
      refundStatus: "Not Connected in MVP",
      requestedAt: createTimestampLabel(),
      resolvedAt: null,
      createdAt: createTimestampLabel(),
      updatedAt: createTimestampLabel(),
    };

    setReturnRequests((current) => [nextRequest, ...current]);
    setOrders((current) =>
      current.map((order) =>
        order.id === matchedOrder.id
          ? {
              ...order,
              orderStatus: "Return Requested",
              returnStatus: "Requested",
              updatedAt: createTimestampLabel(),
              returnNote:
                "Return request created in MVP mode. Real return pickup and refund processing are not connected yet.",
            }
          : order,
      ),
    );

    return nextRequest;
  }

  function addToCart({ productId, size, color, quantity = 1 }: AddToCartInput) {
    const product = catalog.find((item) => item.id === productId);

    if (!product) {
      return {
        ok: false,
        message: "Product could not be found in the current MVP catalog.",
      };
    }

    if (!isApprovedProduct(product)) {
      return {
        ok: false,
        message:
          "Only approved products can be added to the buyer cart in this MVP flow.",
      };
    }

    setCartItems((current) => {
      const existingItem = current.find(
        (item) =>
          item.product.id === productId &&
          item.size === size &&
          item.color === color,
      );

      if (!existingItem) {
        const nextCartItems = [
          ...current,
          {
            id: `cart_item_${product.id}_${size}_${color}`
              .toLowerCase()
              .replace(/[^a-z0-9_]+/g, "_"),
            cartId: "cart_demo_buyer_active",
            product,
            productId,
            image: product.image,
            productVariantId: null,
            quantity,
            size,
            color,
            unitPriceCents:
              (product.salePrice ?? product.price) * 100,
            createdAt: createIsoTimestamp(),
            updatedAt: createIsoTimestamp(),
          },
        ];

        writeStoredValue(cartStorageKey, nextCartItems);
        return nextCartItems;
      }

      const nextCartItems = current.map((item) =>
        item.product.id === productId &&
        item.size === size &&
        item.color === color
          ? {
              ...item,
              quantity: item.quantity + quantity,
              updatedAt: createIsoTimestamp(),
            }
          : item,
      );

      writeStoredValue(cartStorageKey, nextCartItems);
      return nextCartItems;
    });

    return {
      ok: true,
      message: `${product.name} was added to the cart in browser-local MVP state.`,
    };
  }

  function updateCartQuantity(
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ) {
    setCartItems((current) => {
      if (quantity <= 0) {
        const nextCartItems = current.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.size === size &&
              item.color === color
            ),
        );

        writeStoredValue(cartStorageKey, nextCartItems);
        return nextCartItems;
      }

      const nextCartItems = current.map((item) =>
        item.product.id === productId &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity, updatedAt: createIsoTimestamp() }
          : item,
      );

      writeStoredValue(cartStorageKey, nextCartItems);
      return nextCartItems;
    });
  }

  function clearCart() {
    writeStoredValue(cartStorageKey, []);
    setCartItems([]);
  }

  function addToWishlist(productId: string) {
    setWishlistProductIds((current) => {
      const nextWishlistProductIds = current.includes(productId)
        ? current
        : [productId, ...current];

      writeStoredValue(wishlistStorageKey, nextWishlistProductIds);
      return nextWishlistProductIds;
    });
  }

  function removeFromWishlist(productId: string) {
    setWishlistProductIds((current) => {
      const nextWishlistProductIds = current.filter(
        (currentId) => currentId !== productId,
      );

      writeStoredValue(wishlistStorageKey, nextWishlistProductIds);
      return nextWishlistProductIds;
    });
  }

  function toggleWishlist(productId: string) {
    setWishlistProductIds((current) => {
      const nextWishlistProductIds = current.includes(productId)
        ? current.filter((currentId) => currentId !== productId)
        : [productId, ...current];

      writeStoredValue(wishlistStorageKey, nextWishlistProductIds);
      return nextWishlistProductIds;
    });
  }

  function isInWishlist(productId: string) {
    return wishlistProductIds.includes(productId);
  }

  function moveWishlistItemToCart(productId: string) {
    const product = catalog.find((item) => item.id === productId);

    if (!product) {
      return {
        ok: false,
        message: "Wishlist product could not be found in the current catalog.",
      };
    }

    const result = addToCart({
      productId,
      size: product.sizes[0] ?? "",
      color: product.colors[0] ?? "",
      quantity: 1,
    });

    if (result.ok) {
      removeFromWishlist(productId);
    }

    return result;
  }

  function createSupportTicket(input: CreateSupportTicketInput) {
    const nextTicket: SupportTicketRecord = {
      id: createNextSupportId(supportTickets),
      userId:
        input.userType === "Buyer" ? "user_buyer_demo" : "user_seller_demo",
      buyerProfileId:
        input.userType === "Buyer" ? "buyer_profile_demo_buyer" : null,
      sellerProfileId:
        input.userType === "Seller" ? "seller_profile_demo_seller_studio" : null,
      assignedAdminUserId: null,
      userType: input.userType,
      requesterRole: input.userType === "Buyer" ? "BUYER" : "SELLER",
      name: input.name.trim(),
      contact: input.contact.trim(),
      subject: input.issueType.trim(),
      issueType: input.issueType.trim(),
      orderId: input.orderId?.trim() ?? "",
      message: input.message.trim(),
      priority: createSupportPriority(input.issueType),
      status: "Open",
      createdAt: createTimestampLabel(),
      updatedAt: createTimestampLabel(),
    };

    setSupportTickets((current) => [nextTicket, ...current]);

    return nextTicket;
  }

  function getProductById(productId: string) {
    return catalog.find((product) => product.id === productId);
  }

  function getOrderById(orderId: string) {
    return orders.find((order) => order.id === orderId);
  }

  return (
    <MarketplaceContext.Provider
      value={{
        catalog,
        approvedProducts,
        pendingReviewProducts,
        rejectedProducts,
        draftProducts,
        orders,
        buyerOrders,
        returnRequests,
        cartItems,
        wishlistProducts,
        supportTickets,
        sellerApplications,
        latestSellerApplication,
        isHydrated,
        submitProduct,
        updateProductStatus,
        submitSellerApplication,
        updateSellerApplicationStatus,
        advanceOrderStatus,
        setAdminOrderActionState,
        createReturnRequest,
        addToCart,
        updateCartQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveWishlistItemToCart,
        isInWishlist,
        createSupportTicket,
        getProductById,
        getOrderById,
        approvedFacets,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error("useMarketplace must be used within MarketplaceProvider.");
  }

  return context;
}
