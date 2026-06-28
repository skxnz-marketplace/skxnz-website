export const sellerApplicationBetaStorageKey =
  "skxnz-seller-application-beta-submissions";

export const sellerTypeOptions = [
  "Brand",
  "Boutique",
  "Reseller",
  "Designer",
  "Vintage seller",
  "Luxury seller",
  "Streetwear seller",
  "Other",
] as const;

export const sellerCategoryOptions = [
  "Men",
  "Women",
  "Streetwear",
  "Accessories",
  "Perfume",
  "Sneakers",
  "Luxury",
  "Limited edition",
  "Other",
] as const;

export const priceRangeOptions = [
  "Under ₹2,000",
  "₹2,000 - ₹5,000",
  "₹5,000 - ₹10,000",
  "₹10,000 - ₹25,000",
  "₹25,000+",
] as const;

export type SellerTypeOption = (typeof sellerTypeOptions)[number];
export type SellerCategoryOption = (typeof sellerCategoryOptions)[number];
export type SellerPriceRangeOption = (typeof priceRangeOptions)[number];

export type SellerApplicationDraft = {
  businessName: string;
  sellerType: SellerTypeOption;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  mainCategory: SellerCategoryOption;
  subcategories: string;
  averagePriceRange: SellerPriceRangeOption;
  productsReady: string;
  brandDescription: string;
  instagramOrWebsite: string;
  businessDocumentStatus: string;
  brandAuthorizationStatus: string;
  authenticityDeclaration: boolean;
  termsAgreement: boolean;
};

export type DemoSellerApplicationSubmission = SellerApplicationDraft & {
  id: string;
  marketplaceApplicationId: string;
  status: "Internal review";
  demoOnly: true;
  submittedAt: string;
  note: string;
};

export const initialSellerApplicationDraft: SellerApplicationDraft = {
  businessName: "",
  sellerType: "Brand",
  contactPerson: "",
  email: "",
  phone: "",
  city: "",
  country: "India",
  mainCategory: "Streetwear",
  subcategories: "",
  averagePriceRange: "₹5,000 - ₹10,000",
  productsReady: "",
  brandDescription: "",
  instagramOrWebsite: "",
  businessDocumentStatus: "Verification documents will be requested securely later.",
  brandAuthorizationStatus:
    "Brand authorization will be reviewed securely later if applicable.",
  authenticityDeclaration: false,
  termsAgreement: false,
};

function createSubmissionId() {
  return `seller_beta_${Date.now().toString(36)}`;
}

export function getDemoSellerApplicationSubmissions() {
  if (typeof window === "undefined") {
    return [] as DemoSellerApplicationSubmission[];
  }

  try {
    const storedValue = window.localStorage.getItem(
      sellerApplicationBetaStorageKey,
    );

    if (!storedValue) {
      return [] as DemoSellerApplicationSubmission[];
    }

    return JSON.parse(storedValue) as DemoSellerApplicationSubmission[];
  } catch {
    return [] as DemoSellerApplicationSubmission[];
  }
}

export function saveDemoSellerApplicationSubmission(
  draft: SellerApplicationDraft,
  marketplaceApplicationId: string,
) {
  const nextSubmission: DemoSellerApplicationSubmission = {
    ...draft,
    id: createSubmissionId(),
    marketplaceApplicationId,
    status: "Internal review",
    demoOnly: true,
    submittedAt: new Date().toISOString(),
    note: "Seller application beta. Real verification, seller account activation, payouts, and secure document collection are not connected yet.",
  };

  if (typeof window !== "undefined") {
    const currentSubmissions = getDemoSellerApplicationSubmissions();

    window.localStorage.setItem(
      sellerApplicationBetaStorageKey,
      JSON.stringify([nextSubmission, ...currentSubmissions]),
    );
  }

  return nextSubmission;
}
