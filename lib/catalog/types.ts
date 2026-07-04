// Types mirror supabase/migrations/0002_catalog_layer.sql. Keep in sync manually
// until Supabase-generated types replace this file.

export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "ARCHIVED";

export type Brand = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  seller_id: string | null;
  brand_id: string | null;
  category_id: string | null;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  status: ProductStatus;
  price_inr: number;
  compare_at_price_inr: number | null;
  currency: string;
  image_url: string | null;
  tags: string[];
  is_featured: boolean;
  is_limited: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  price_inr: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductWithRelations = Product & {
  brand: Brand | null;
  category: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
};
