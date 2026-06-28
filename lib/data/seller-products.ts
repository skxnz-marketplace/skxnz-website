import {
  fallbackProductImage,
  type Product,
  type ProductSubmissionInput,
  type ProductStatus,
} from "@/src/data/demo-products";

export type SellerDemoProductStatus =
  | "Draft"
  | "Pending internal review"
  | "Live Demo"
  | "Rejected Demo";

export type SellerProductUploadDraft = {
  productName: string;
  brandName: string;
  category: string;
  subcategory: string;
  price: string;
  compareAtPrice: string;
  sizeOptions: string;
  colorOptions: string;
  description: string;
  imageUrl: string;
  inventoryCount: string;
  tags: string;
  isLimitedEdition: boolean;
  isNewSeason: boolean;
  isAIStyled: boolean;
};

export const sellerProductCategories = [
  "Men",
  "Women",
  "Streetwear",
  "Accessories",
  "Perfume",
  "Sneakers",
  "Luxury",
  "Limited Edition",
  "Other",
];

export const initialSellerProductUploadDraft: SellerProductUploadDraft = {
  productName: "",
  brandName: "",
  category: "Streetwear",
  subcategory: "",
  price: "",
  compareAtPrice: "",
  sizeOptions: "S, M, L, XL",
  colorOptions: "Black",
  description: "",
  imageUrl: "",
  inventoryCount: "1",
  tags: "",
  isLimitedEdition: false,
  isNewSeason: false,
  isAIStyled: false,
};

export function splitSellerList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveSellerDemoProductStatus(
  status: ProductStatus,
): SellerDemoProductStatus {
  if (status === "Approved Preview") return "Live Demo";
  if (status === "Rejected Review") return "Rejected Demo";
  if (status === "Draft Placeholder") return "Draft";
  return "Pending internal review";
}

export function getSellerProductStatusTone(status: SellerDemoProductStatus) {
  if (status === "Live Demo") return "border-[rgba(47,111,115,0.24)] bg-[rgba(47,111,115,0.08)] text-teal";
  if (status === "Rejected Demo") return "border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] text-sangria";
  if (status === "Draft") return "border-[rgba(58,8,24,0.16)] bg-white text-midnightbrown";
  return "border-[rgba(34,211,238,0.26)] bg-[rgba(34,211,238,0.07)] text-sangria";
}

export function validateSellerProductDraft(form: SellerProductUploadDraft) {
  const errors: string[] = [];
  const price = Number(form.price);
  const inventoryCount = Number(form.inventoryCount);

  if (!form.productName.trim()) errors.push("Product name is required.");
  if (!form.brandName.trim()) errors.push("Brand name is required.");
  if (!form.subcategory.trim()) errors.push("Subcategory is required.");
  if (!price || price <= 0) errors.push("Price must be greater than 0.");
  if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
    errors.push("Inventory count must be 0 or higher.");
  }
  if (splitSellerList(form.sizeOptions).length === 0) {
    errors.push("Add at least one size option.");
  }
  if (splitSellerList(form.colorOptions).length === 0) {
    errors.push("Add at least one color option.");
  }
  if (form.description.trim().length < 20) {
    errors.push("Description should be at least 20 characters for review context.");
  }

  return errors;
}

export function mapSellerDraftToProductSubmission(
  form: SellerProductUploadDraft,
): ProductSubmissionInput {
  const tags = [
    ...splitSellerList(form.tags),
    form.brandName.trim(),
    form.subcategory.trim(),
    form.isLimitedEdition ? "Limited Edition" : "",
    form.isNewSeason ? "New Season" : "",
    form.isAIStyled ? "AI Styled" : "",
  ].filter(Boolean);

  return {
    name: form.productName.trim(),
    category: form.category,
    price: Number(form.price),
    salePrice: null,
    sizes: splitSellerList(form.sizeOptions),
    colors: splitSellerList(form.colorOptions),
    stock: Number(form.inventoryCount) || 0,
    fabric: "Not specified in seller beta",
    fit: "Not specified in seller beta",
    description: [
      form.description.trim(),
      `Brand: ${form.brandName.trim()}.`,
      form.compareAtPrice.trim()
        ? `Compare-at price preview: ${form.compareAtPrice.trim()}.`
        : "",
      "Submitted through Seller Dashboard Beta. Pending internal review before any public publishing.",
    ]
      .filter(Boolean)
      .join(" "),
    imageUrl: form.imageUrl.trim() || fallbackProductImage,
    tags,
  };
}

export function getSellerProducts(products: Product[]) {
  return [...products].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
