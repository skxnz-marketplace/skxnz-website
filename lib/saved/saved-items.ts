// Shared types + validators for buyer saved items (wishlist / save-for-later).
// Pure data helpers — no Supabase client, no "use server". Imported by both the
// server read/action layer and (types only) the client wishlist provider.
//
// price_inr is a WHOLE-RUPEE display snapshot, matching public.products and the
// buyer Product.price field. It is NOT a payment amount and makes no promise
// about live stock, payment, or delivery.

export type SavedItemSource = "live" | "demo";

/** What the client is allowed to send when saving a product. The server
 * derives user_id from the session — it is never part of this input. */
export type SaveProductInput = {
  productId?: string | null;
  productSlug: string;
  productTitle: string;
  brandName?: string | null;
  priceInr?: number | null;
  imageUrl?: string | null;
  selectedSize?: string | null;
  selectedVariantId?: string | null;
  source?: SavedItemSource;
};

/** A saved item as read back from the DB (snapshot columns only). */
export type SavedItemRecord = {
  id: string;
  productId: string | null;
  productSlug: string;
  productTitle: string;
  brandName: string | null;
  priceInr: number | null;
  imageUrl: string | null;
  selectedSize: string | null;
  selectedVariantId: string | null;
  source: SavedItemSource;
  createdAt: string;
  updatedAt: string;
};

export type SaveProductResult =
  | { ok: true; savedItemId: string }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

export type RemoveSavedProductResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "VALIDATION_FAILED" | "NOT_WIRED" | "DB_ERROR";
      message: string;
    };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidShape(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Server-side sanitisation. Trims/limits snapshot fields, coerces price to a
 * non-negative integer, drops uuid-shaped fields that are not valid uuids.
 * Returns a normalised input or an error message. */
export function validateSaveProductInput(
  input: SaveProductInput,
):
  | { ok: true; value: Required<Pick<SaveProductInput, "productSlug" | "productTitle" | "source">> & SaveProductInput }
  | { ok: false; message: string } {
  const productSlug = (input.productSlug ?? "").trim();
  const productTitle = (input.productTitle ?? "").trim();

  if (!productSlug || productSlug.length > 200) {
    return { ok: false, message: "A valid product is required to save." };
  }

  if (!productTitle || productTitle.length > 300) {
    return { ok: false, message: "A valid product title is required to save." };
  }

  const source: SavedItemSource = input.source === "demo" ? "demo" : "live";

  const rawPrice = input.priceInr;
  const priceInr =
    typeof rawPrice === "number" && Number.isFinite(rawPrice) && rawPrice >= 0
      ? Math.round(rawPrice)
      : null;

  const productId = isUuidShape(input.productId ?? undefined)
    ? (input.productId as string)
    : null;
  const selectedVariantId = isUuidShape(input.selectedVariantId ?? undefined)
    ? (input.selectedVariantId as string)
    : null;

  const brandName = clampText(input.brandName, 160);
  const imageUrl = clampText(input.imageUrl, 1000);
  const selectedSize = clampText(input.selectedSize, 60);

  return {
    ok: true,
    value: {
      productId,
      productSlug,
      productTitle,
      brandName,
      priceInr,
      imageUrl,
      selectedSize,
      selectedVariantId,
      source,
    },
  };
}

function clampText(value: string | null | undefined, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
