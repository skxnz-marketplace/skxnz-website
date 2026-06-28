import {
  skxnzProducts,
  type SkxnzProduct,
} from "@/src/data/skxnz-products";
import {
  controlledSkxnzPlaceholderImage,
  ensureCatalogImage,
  resolveCategoryDisplayName,
  resolveCategorySlug,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";
import { ensureProductAsset } from "@/src/lib/assets";

export type ProductStatus =
  | "Approved Preview"
  | "Pending Review"
  | "Rejected Review"
  | "Draft Placeholder";

export type Product = {
  id: string;
  slug: string;
  sellerProfileId: string;
  categoryId: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  name: string;
  shortDescription: string;
  price: number;
  priceCents: number;
  salePrice: number | null;
  category: string;
  subcategory: string;
  subtitle: string;
  description: string;
  gradient: string;
  accent: string;
  seller: string;
  deliveryWindow: string;
  features: string[];
  materials: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  inventoryCount: number;
  status: ProductStatus;
  launchNote: string;
  fabric: string;
  fit: string;
  tags: string[];
  collections: string[];
  searchAliases: string[];
  image: string;
  gallery: string[];
  imageUrl: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductSubmissionInput = {
  name: string;
  category: string;
  price: number;
  salePrice: number | null;
  sizes: string[];
  colors: string[];
  stock: number;
  fabric: string;
  fit: string;
  description: string;
  imageUrl: string;
  tags?: string[];
};

export type CartPreviewItem = {
  id: string;
  cartId: string;
  product: Product;
  productId: string;
  image: string;
  productVariantId: string | null;
  quantity: number;
  size: string;
  color: string;
  unitPriceCents: number;
  createdAt: string;
  updatedAt: string;
};

export const fallbackProductImage = controlledSkxnzPlaceholderImage;

export const legacyProductIdAliases: Record<string, string> = {
  "neutra-x-hoodie": "chrome-trace-hoodie",
  "x-1-signal-jacket": "pearl-signal-crop-jacket",
  "signal-flow-tee": "obsidian-signal-oversized-tee",
  "vortex-runners": "pearl-white-sneakers",
  "chrome-x-cap": "chrome-district-bracelet",
  "quantum-backpack": "future-runner-crossbody",
  "aether-grid-cargo": "midnight-cargo-pants",
  "nova-signal-vest": "obsidian-rider-vest",
};

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function resolveProductStatus(status: string): ProductStatus {
  const normalizedStatus = normalizeValue(status);

  if (normalizedStatus.includes("pending")) {
    return "Pending Review";
  }

  if (normalizedStatus.includes("reject")) {
    return "Rejected Review";
  }

  if (normalizedStatus.includes("draft")) {
    return "Draft Placeholder";
  }

  return "Approved Preview";
}

function resolveSellerName(brandName: string, brandSlug: string) {
  if (brandSlug === "skxnz") {
    return "SKXNZ Studio";
  }

  return brandName;
}

function resolveFabricLabel(subcategory: string, category: string) {
  const normalizedSubcategory = normalizeValue(subcategory);
  const normalizedCategory = normalizeValue(category);

  if (normalizedCategory.includes("perfume")) {
    return "Fragrance composition preview";
  }

  if (normalizedCategory.includes("accessories")) {
    return "Premium accessory construction";
  }

  if (normalizedCategory.includes("footwear")) {
    return "Mixed upper materials";
  }

  if (normalizedSubcategory.includes("hoodie")) {
    return "Heavyweight cotton blend";
  }

  if (normalizedSubcategory.includes("tee") || normalizedSubcategory.includes("shirt")) {
    return "Premium cotton jersey";
  }

  if (
    normalizedSubcategory.includes("jacket") ||
    normalizedSubcategory.includes("coat") ||
    normalizedSubcategory.includes("vest")
  ) {
    return "Structured technical weave";
  }

  if (normalizedSubcategory.includes("pant")) {
    return "Technical cotton blend";
  }

  return "Premium demo material blend";
}

function resolveFitLabel(subcategory: string, category: string) {
  const normalizedSubcategory = normalizeValue(subcategory);
  const normalizedCategory = normalizeValue(category);

  if (normalizedCategory.includes("perfume")) {
    return "Display preview";
  }

  if (normalizedCategory.includes("accessories")) {
    return "Everyday carry profile";
  }

  if (normalizedCategory.includes("footwear")) {
    return "Supportive sneaker fit";
  }

  if (normalizedSubcategory.includes("hoodie") || normalizedSubcategory.includes("tee")) {
    return "Relaxed premium fit";
  }

  if (normalizedSubcategory.includes("jacket") || normalizedSubcategory.includes("coat")) {
    return "Structured editorial fit";
  }

  if (normalizedSubcategory.includes("pant")) {
    return "Tapered utility fit";
  }

  if (normalizedSubcategory.includes("shirt")) {
    return "Layered relaxed fit";
  }

  return "Curated preview fit";
}

function resolveFeatureStack(product: SkxnzProduct) {
  const sizePreview =
    product.sizes.length > 0
      ? `Available in ${product.sizes.slice(0, 4).join(", ")}.`
      : "Size availability will be confirmed during catalog finalization.";

  return uniqueNonEmpty([
    `${titleCase(product.subcategory)} built for premium preview styling.`,
    product.tags[0]
      ? `${titleCase(product.tags[0])} detailing shaped for a cleaner editorial silhouette.`
      : null,
    sizePreview,
  ]);
}

function resolveMaterialNotes(product: SkxnzProduct) {
  const fabricLabel = resolveFabricLabel(product.subcategory, product.category);

  return uniqueNonEmpty([
    fabricLabel,
    product.colors[0]
      ? `${product.colors[0]} finish for a stronger brand signal.`
      : null,
    product.collections[0]
      ? `Curated for the ${product.collections[0]} collection.`
      : null,
  ]);
}

function resolveAccent(product: SkxnzProduct) {
  return (
    product.collections[0] ??
    product.colors[0] ??
    resolveCategoryDisplayName(product.category)
  );
}

function resolveLaunchNote(product: SkxnzProduct) {
  const collectionName = product.collections[0] ?? "SKXNZ buyer preview";

  return product.isDemo
    ? `Demo seed product from the SKXNZ planning sheets for the ${collectionName} release preview.`
    : `Catalog product for the ${collectionName} release preview.`;
}

function resolveProductImageGallery(product: SkxnzProduct) {
  const primaryImage = ensureProductAsset(product.images[0], product.slug);
  const gallery = uniqueNonEmpty([
    primaryImage,
    ...product.images.map((image) => ensureCatalogImage(image)),
  ]);

  return {
    image: primaryImage,
    gallery: gallery.length > 0 ? gallery : [fallbackProductImage],
  };
}

function resolveProductId(id: string) {
  return legacyProductIdAliases[id] ?? id;
}

const structuredProductLookup = new Map(
  skxnzProducts.map((product) => [product.slug, product]),
);

export function getProductMedia(productId: string) {
  const resolvedId = resolveProductId(productId);
  const structuredProduct = structuredProductLookup.get(resolvedId);

  if (!structuredProduct) {
    return {
      image: fallbackProductImage,
      gallery: [fallbackProductImage],
    };
  }

  return resolveProductImageGallery(structuredProduct);
}

type ProductWithOptionalMedia = Omit<Product, "image" | "gallery"> &
  Partial<Pick<Product, "image" | "gallery">>;

export function applyDemoProductMedia(product: ProductWithOptionalMedia): Product {
  const media = getProductMedia(product.id);
  const image = ensureProductAsset(product.image ?? media.image, product.slug);
  const gallery = (product.gallery?.length ? product.gallery : media.gallery).map(
    (entry, index) => (index === 0 ? image : ensureCatalogImage(entry)),
  );

  return {
    ...product,
    image,
    gallery: gallery.length > 0 ? gallery : [fallbackProductImage],
    imageUrl: product.imageUrl?.startsWith("/assets/") ? product.imageUrl : image,
  };
}

const importedProducts = skxnzProducts.map((entry) => {
  const categorySlug = resolveCategorySlug(entry.category);
  const categoryLabel = resolveCategoryDisplayName(entry.category);
  const media = resolveProductImageGallery(entry);
  const sellerName = resolveSellerName(entry.brandName, entry.brandSlug);
  const displayPrice = entry.compareAtPrice ?? entry.price;
  const salePrice = entry.compareAtPrice ? entry.price : null;

  return applyDemoProductMedia({
    id: entry.slug,
    slug: entry.slug,
    sellerProfileId: entry.sellerId,
    categoryId: `category_${categorySlug}`,
    brandId: entry.brandId,
    brandSlug: entry.brandSlug,
    brandName: entry.brandName,
    name: entry.productName,
    shortDescription: entry.shortDescription,
    price: displayPrice,
    priceCents: displayPrice * 100,
    salePrice,
    category: categoryLabel,
    subcategory: entry.subcategory,
    subtitle: entry.shortDescription,
    description: entry.description,
    gradient: "from-sandstone/30 via-transparent to-pearlcream/60",
    accent: resolveAccent(entry),
    seller: sellerName,
    deliveryWindow: "Sample timeline: 5-7 business days after launch",
    features: resolveFeatureStack(entry),
    materials: resolveMaterialNotes(entry),
    sizes: entry.sizes,
    colors: entry.colors,
    stock: entry.inventory,
    inventoryCount: entry.inventory,
    status: resolveProductStatus(entry.status),
    launchNote: resolveLaunchNote(entry),
    fabric: resolveFabricLabel(entry.subcategory, entry.category),
    fit: resolveFitLabel(entry.subcategory, entry.category),
    tags: uniqueNonEmpty([
      ...entry.tags,
      categoryLabel,
      entry.subcategory,
      entry.brandName,
      ...(entry.isLimitedEdition ? ["Limited Edition"] : []),
      ...(entry.isAIStyled ? ["AI Styled", "AI Stylised"] : []),
      ...(entry.isNewSeason ? ["New Season"] : []),
      ...(entry.isDemo ? ["Demo seed data"] : []),
    ]),
    collections: entry.collections,
    searchAliases: uniqueNonEmpty(entry.searchKeywords),
    image: media.image,
    gallery: media.gallery,
    imageUrl: media.image,
    submittedAt: entry.createdAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  });
});

export const products: Product[] = importedProducts;

export const categories = Array.from(
  new Set(products.map((product) => product.category)),
);

export const sizes = Array.from(
  new Set(products.flatMap((product) => product.sizes)),
);

export const colors = Array.from(
  new Set(products.flatMap((product) => product.colors)),
);

const featuredProductIds = new Set(
  skxnzProducts
    .filter((product) => product.isFeatured)
    .map((product) => product.slug),
);

export const featuredProducts = products
  .filter((product) => featuredProductIds.has(product.id))
  .slice(0, 4);

export const cartPreview: CartPreviewItem[] = featuredProducts.slice(0, 2).map(
  (product, index) => ({
    id: `cart_item_${product.id}`,
    cartId: "cart_demo_buyer_active",
    product,
    productId: product.id,
    image: product.image,
    productVariantId: `${product.id}_variant_${index + 1}`,
    quantity: 1,
    size: product.sizes[0] ?? "One Size",
    color: product.colors[0] ?? "Pearl Cream",
    unitPriceCents: (product.salePrice ?? product.price) * 100,
    createdAt: `2026-05-05T09:1${index}:00.000Z`,
    updatedAt: `2026-05-05T09:1${index}:00.000Z`,
  }),
);

export const pendingProducts = products.filter(
  (product) => product.status !== "Approved Preview",
);

export function getProductById(id: string) {
  const resolvedId = resolveProductId(id);

  return products.find(
    (product) => product.id === resolvedId || product.slug === resolvedId,
  );
}

export function isApprovedProduct(product: Product) {
  return product.status === "Approved Preview";
}

export function deriveProductFacets(collection: Product[]) {
  return {
    categories: Array.from(new Set(collection.map((product) => product.category))),
    sizes: Array.from(new Set(collection.flatMap((product) => product.sizes))),
    colors: Array.from(new Set(collection.flatMap((product) => product.colors))),
  };
}

export function formatProductPrice(value: number) {
  return priceFormatter.format(value);
}

export function createProductIdFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
