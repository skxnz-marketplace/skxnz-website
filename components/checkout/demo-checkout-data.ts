import type { CartPreviewItem } from "@/lib/data/products";

export const demoCheckoutOrderStorageKey = "skxnz-demo-checkout-order";

export type DemoShippingDetails = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type DemoPaymentMethod = "cod-demo" | "card-demo" | "upi-demo";

export type DemoCheckoutOrder = {
  id: string;
  createdAt: string;
  shipping: DemoShippingDetails;
  paymentMethod: DemoPaymentMethod;
  paymentLabel: string;
  items: CartPreviewItem[];
  subtotal: number;
  shippingEstimate: number;
  total: number;
  note: string;
};

export const demoPaymentLabels: Record<DemoPaymentMethod, string> = {
  "cod-demo": "Cash on delivery demo",
  "card-demo": "Card demo placeholder",
  "upi-demo": "UPI demo placeholder",
};

