// This release uses Next's 1 MiB server-action transport. Leave 256 KiB for
// multipart/action metadata; the Storage bucket's larger limit is not this UI contract.
export const PRODUCT_IMAGE_MAX_BYTES = 768 * 1024;
export const PRODUCT_IMAGE_MAX_LABEL = "768 KiB";
export const PRODUCT_IMAGE_UPLOAD_RETRY_MESSAGE =
  "The upload could not be completed. Check your connection and try again with an image of 768 KiB or smaller.";

export function validateProductImage(file: { size: number; type: string }): string | null {
  if (!Number.isInteger(file.size) || file.size <= 0) return "Choose an image file.";
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return `Image must be ${PRODUCT_IMAGE_MAX_LABEL} or smaller.`;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Image must be JPEG, PNG, or WebP.";
  }
  return null;
}
