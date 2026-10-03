"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";
import { isUuidShape } from "@/lib/saved/saved-items";
import { validateProductImage } from "@/lib/catalog/image-upload-contract";

type UploadActionResult =
  | { ok: true; imageId: string; url: string }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "NOT_FOUND" | "RATE_LIMITED" | "DB_ERROR";
      message: string;
    };

type SimpleActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "NOT_FOUND" | "RATE_LIMITED" | "DB_ERROR";
      message: string;
    };

const MAX_IMAGES_PER_PRODUCT = 8;

function uploadDbError(): UploadActionResult {
  return { ok: false, code: "DB_ERROR", message: "That didn't go through. Please try again." };
}

function simpleDbError(): SimpleActionResult {
  return { ok: false, code: "DB_ERROR", message: "That didn't go through. Please try again." };
}

function extensionFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/** Resolves the caller's identity plus whether they may manage this
 * product's images: the owning seller, or any admin. Mirrors the
 * requireAdmin() pattern in lib/community/admin-community-actions.ts. */
async function authorizeProductImageAccess(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, allowed: false, sellerId: null as string | null };
  }

  const [{ data: role }, { data: product }] = await Promise.all([
    supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("products").select("id, seller_id").eq("id", productId).maybeSingle(),
  ]);

  if (!product) {
    return { supabase, user, allowed: false, sellerId: null };
  }

  const isAdmin = role?.role === "ADMIN";
  const isOwner = product.seller_id === user.id;

  return { supabase, user, allowed: isAdmin || isOwner, sellerId: product.seller_id };
}

export async function uploadProductImage(formData: FormData): Promise<UploadActionResult> {
  const productId = formData.get("productId");
  const file = formData.get("file");

  if (typeof productId !== "string" || !isUuidShape(productId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid product." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Choose an image file." };
  }
  const validationError = validateProductImage(file);
  if (validationError) return { ok: false, code: "VALIDATION_FAILED", message: validationError };

  const { supabase, user, allowed, sellerId } = await authorizeProductImageAccess(productId);
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "You can only manage images for your own products." };
  }

  const limit = await guardServerAction("seller.product.write", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images. Delete one first.`,
    };
  }

  // Folder = the product's owning seller (or the caller's own id for
  // legacy/seller-less rows) — must match the storage RLS policy's
  // "(storage.foldername(name))[1] = auth.uid()" check for a seller, and
  // is irrelevant for an admin (their uploads pass either way).
  const folderId = sellerId ?? user.id;
  const storagePath = `${folderId}/${productId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.warn("[catalog] image upload failed:", uploadError.message);
    return uploadDbError();
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(storagePath);

  const nextSortOrder = count ?? 0;
  const { data: image, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      storage_path: storagePath,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertError || !image) {
    // Row insert failed after a successful upload — clean up the orphaned
    // object rather than leaving a real file with no product_images row.
    await supabase.storage.from("product-images").remove([storagePath]);
    return uploadDbError();
  }

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  revalidatePath(`/product/${productId}`);
  return { ok: true, imageId: image.id, url: publicUrl };
}

export async function deleteProductImage(imageId: string): Promise<SimpleActionResult> {
  if (!isUuidShape(imageId)) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  }

  const { data: image, error: imageError } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path")
    .eq("id", imageId)
    .maybeSingle();

  if (imageError) return simpleDbError();
  if (!image) return { ok: false, code: "NOT_FOUND", message: "Image not found." };

  const { allowed } = await authorizeProductImageAccess(image.product_id);
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "You can only manage images for your own products." };
  }

  const limit = await guardServerAction("seller.product.write", { userId: user.id });
  if (!limit.ok) return limit.error;

  const { error: deleteRowError } = await supabase.from("product_images").delete().eq("id", imageId);
  if (deleteRowError) return simpleDbError();

  if (image.storage_path) {
    const { error: deleteObjectError } = await supabase.storage
      .from("product-images")
      .remove([image.storage_path]);
    if (deleteObjectError) {
      console.warn("[catalog] storage object cleanup failed:", deleteObjectError.message);
    }
  }

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  revalidatePath(`/product/${image.product_id}`);
  return { ok: true };
}

export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[],
): Promise<SimpleActionResult> {
  if (!isUuidShape(productId) || orderedImageIds.some((id) => !isUuidShape(id))) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Invalid request." };
  }

  const { supabase, user, allowed } = await authorizeProductImageAccess(productId);
  if (!user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "You can only manage images for your own products." };
  }

  const limit = await guardServerAction("seller.product.write", { userId: user.id });
  if (!limit.ok) return limit.error;

  const updates = await Promise.all(
    orderedImageIds.map((imageId, index) =>
      supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("product_id", productId),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed) return simpleDbError();

  revalidatePath(`/product/${productId}`);
  return { ok: true };
}
