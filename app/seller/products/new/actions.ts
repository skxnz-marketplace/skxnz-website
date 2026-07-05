"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type ProductUploadActionState = {
  message?: string;
};

function requiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = requiredText(formData, key);
  return value.length > 0 ? value : null;
}

function parseWholeNumber(value: string, label: string, min = 0) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${label} must be a whole number ${min > 0 ? `at least ${min}` : "0 or higher"}.`);
  }

  return parsed;
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function createSku(slug: string, index: number) {
  return `SKXNZ-${slug}-${String(index + 1).padStart(2, "0")}`
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .slice(0, 96);
}

function buildVariantRows(productId: string, slug: string, sizes: string[], colors: string[], stock: number) {
  const safeSizes = sizes.length > 0 ? sizes : [null];
  const safeColors = colors.length > 0 ? colors : [null];
  const variants = safeSizes.flatMap((size) =>
    safeColors.map((color) => ({ size, color })),
  );
  const baseStock = variants.length > 0 ? Math.floor(stock / variants.length) : stock;
  const remainder = variants.length > 0 ? stock % variants.length : 0;

  return variants.map((variant, index) => ({
    product_id: productId,
    sku: createSku(slug, index),
    size: variant.size,
    color: variant.color,
    price_inr: null,
    stock_quantity: baseStock + (index < remainder ? 1 : 0),
    is_active: true,
  }));
}

export async function createSellerProduct(
  _previousState: ProductUploadActionState,
  formData: FormData,
): Promise<ProductUploadActionState> {
  await requireRole(["SELLER", "ADMIN"], "/seller/products/new");

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: "You must be logged in as a seller before creating a product." };
  }

  try {
    const name = requiredText(formData, "name");
    const brandId = requiredText(formData, "brand_id");
    const categoryId = requiredText(formData, "category_id");
    const description = requiredText(formData, "description");
    const price = parseWholeNumber(requiredText(formData, "price_inr"), "Price", 1);
    const compareAtValue = optionalText(formData, "compare_at_price_inr");
    const compareAtPrice = compareAtValue
      ? parseWholeNumber(compareAtValue, "Compare-at price", price)
      : null;
    const stock = parseWholeNumber(requiredText(formData, "stock_quantity"), "Stock");
    const sizes = splitList(requiredText(formData, "sizes"));
    const colors = splitList(requiredText(formData, "colors"));
    const imageUrl = optionalText(formData, "image_url");
    const fabric = optionalText(formData, "fabric");
    const fit = optionalText(formData, "fit");
    const tags = [
      ...splitList(requiredText(formData, "tags")),
      fabric,
      fit,
    ].filter((tag): tag is string => Boolean(tag));

    if (!name) {
      return { message: "Product name is required." };
    }

    if (description.length < 20) {
      return { message: "Description should be at least 20 characters for review context." };
    }

    // V1 QA fallback: sellers do not have to pick a brand/category manually.
    // When omitted, assign the first active brand (by name) and first active
    // category (by sort_order). Brand-specific seller assignment comes later.
    let resolvedBrandId = brandId;
    if (!resolvedBrandId) {
      const { data: fallbackBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("is_active", true)
        .order("name")
        .limit(1)
        .maybeSingle();
      resolvedBrandId = fallbackBrand?.id ?? "";
    }

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const { data: fallbackCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      resolvedCategoryId = fallbackCategory?.id ?? "";
    }

    if (!resolvedBrandId || !resolvedCategoryId) {
      return {
        message:
          "No active brand or category exists in the catalog, so the product cannot be submitted. Ask the admin to activate at least one brand and one category.",
      };
    }

    const [{ data: brand }, { data: category }] = await Promise.all([
      supabase.from("brands").select("id").eq("id", resolvedBrandId).eq("is_active", true).maybeSingle(),
      supabase.from("categories").select("id").eq("id", resolvedCategoryId).eq("is_active", true).maybeSingle(),
    ]);

    if (!brand || !category) {
      return { message: "Selected brand or category is not available for seller submission." };
    }

    const slugBase = slugify(name) || "seller-product";
    const suffix = crypto.randomUUID().slice(0, 8);
    const slug = `${slugBase}-${suffix}`;
    const subtitle = [fit, fabric].filter(Boolean).join(" / ") || null;

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        seller_id: user.id,
        brand_id: resolvedBrandId,
        category_id: resolvedCategoryId,
        slug,
        name,
        subtitle,
        description,
        status: "PENDING_REVIEW",
        price_inr: price,
        compare_at_price_inr: compareAtPrice,
        currency: "INR",
        image_url: imageUrl,
        tags,
        is_featured: false,
        is_limited: false,
      })
      .select("id")
      .single();

    if (productError || !product) {
      return {
        message: `Product could not be created: ${productError?.message ?? "No product row returned."}`,
      };
    }

    const variantRows = buildVariantRows(product.id, slug, sizes, colors, stock);
    if (variantRows.length > 0) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantRows);

      if (variantError) {
        return { message: `Product was created, but variants could not be saved: ${variantError.message}` };
      }
    }

    if (imageUrl) {
      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: product.id,
        url: imageUrl,
        alt: name,
        sort_order: 0,
      });

      if (imageError) {
        return { message: `Product was created, but the image could not be saved: ${imageError.message}` };
      }
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Product could not be created.",
    };
  }

  revalidatePath("/seller/products");
  revalidatePath("/seller/dashboard");
  redirect("/seller/products");
}
