export type SkxnzCurrency = "INR" | "USD";

export type SkxnzUserRole = "BUYER" | "SELLER" | "RIDER" | "ADMIN";

export type SkxnzProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type SkxnzOrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "CANCELLED";

export type SkxnzPaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "NOT_CONNECTED";

export type SkxnzSellerApplicationStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_MORE_INFO"
  | "SUSPENDED";

export type SkxnzCommunityPostStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "HIDDEN"
  | "REMOVED";

export type UserProfile = {
  id: string;
  userId: string;
  role: SkxnzUserRole;
  name: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  stylePreference?: string | null;
  preferredFit?: string | null;
  budgetRange?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  sellerId?: string | null;
  brandId: string;
  brandName: string;
  productName: string;
  slug: string;
  category: string;
  subcategory?: string | null;
  gender?: string | null;
  price: number;
  compareAtPrice?: number | null;
  currency: SkxnzCurrency;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string;
  shortDescription: string;
  tags: string[];
  inventory: number;
  status: SkxnzProductStatus;
  isFeatured: boolean;
  isLimitedEdition: boolean;
  isAIStyled: boolean;
  isNewSeason: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  userId?: string | null;
  guestCartId?: string | null;
  productId: string;
  productVariantId?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  quantity: number;
  unitPrice: number;
  currency: SkxnzCurrency;
  createdAt: string;
  updatedAt: string;
};

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  productVariantId?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Address = {
  id: string;
  userId: string;
  label?: string | null;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DemoOrderStatus =
  | "Demo placed"
  | "Demo processing"
  | "Demo shipped"
  | "Demo delivered"
  | "Demo cancelled";

export type DemoOrderItem = {
  id: string;
  productId: string;
  productName: string;
  brandName?: string | null;
  image?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: SkxnzCurrency;
};

export type DemoOrder = {
  id: string;
  userId: string;
  status: DemoOrderStatus;
  paymentLabel: string;
  subtotal: number;
  shippingEstimate: number;
  total: number;
  currency: SkxnzCurrency;
  shippingAddress: Address;
  items: DemoOrderItem[];
  source: "seed" | "demo-checkout";
  demoOnly: true;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type CartSyncStatus = {
  mode: "guest-local" | "ready-for-account-sync" | "database-connected";
  localCartItemCount: number;
  localCartQuantity: number;
  canSyncNow: boolean;
  message: string;
  nextStep: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productVariantId?: string | null;
  sellerId?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: SkxnzCurrency;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  userId: string;
  status: SkxnzOrderStatus;
  paymentStatus: SkxnzPaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: SkxnzCurrency;
  shippingAddress: Address;
  items: OrderItem[];
  demoOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SellerApplication = {
  id: string;
  userId?: string | null;
  storeName: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  instagramPage?: string | null;
  city: string;
  productCategory: string;
  productCount: number;
  gstAvailable: boolean;
  canShipOrders: boolean;
  productPhotoLink?: string | null;
  priceRange?: string | null;
  notes?: string | null;
  status: SkxnzSellerApplicationStatus;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunityPostProduct = {
  postId: string;
  productId: string;
  label?: string | null;
};

export type CommunityPost = {
  id: string;
  userId: string;
  caption: string;
  imageUrl?: string | null;
  status: SkxnzCommunityPostStatus;
  visibility: "PRIVATE_BETA" | "PUBLIC";
  products: CommunityPostProduct[];
  likeCount: number;
  saveCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};
