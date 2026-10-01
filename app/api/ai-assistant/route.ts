import { NextResponse } from "next/server";

import {
  createSkxnzAssistantResponse,
  demoAssistantCatalog,
  skxnzAssistantLimits,
  type AssistantCatalog,
  type SkxnzAssistantContext,
} from "@/src/lib/skxnzAssistant";
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { listActiveBrands, listActiveCategories, listActiveProducts } from "@/lib/catalog/public-catalog";
import { guardRouteHandler } from "@/lib/security/rate-limit/rate-limit";

export const dynamic = "force-dynamic";

type AssistantRequestBody = {
  message?: unknown;
  context?: unknown;
};

function sanitizeMessage(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().replace(/\s+/g, " ");
}

function sanitizeString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitizedValue = sanitizeMessage(value);

  return sanitizedValue || undefined;
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => sanitizeString(item))
    .filter((item): item is string => Boolean(item))
    .filter((item) => /^[a-z0-9-]+$/i.test(item))
    .slice(0, 20);
}

function sanitizeAssistantContext(value: unknown): SkxnzAssistantContext {
  if (!value || typeof value !== "object") {
    return {};
  }

  const context = value as Record<string, unknown>;
  const stylePreferences =
    context.stylePreferences && typeof context.stylePreferences === "object"
      ? (context.stylePreferences as Record<string, unknown>)
      : {};

  return {
    cartProductIds: sanitizeStringArray(context.cartProductIds),
    wishlistProductIds: sanitizeStringArray(context.wishlistProductIds),
    stylePreferences: {
      preferredCategory: sanitizeString(stylePreferences.preferredCategory),
      favouriteBrands: sanitizeString(stylePreferences.favouriteBrands),
      favouriteColors: sanitizeString(stylePreferences.favouriteColors),
      styleVibe: sanitizeString(stylePreferences.styleVibe),
      budgetRange: sanitizeString(stylePreferences.budgetRange),
      sizePreferences: sanitizeString(stylePreferences.sizePreferences),
    },
  };
}

export async function POST(request: Request) {
  // Abuse control: policy 'ai.request'. Returns a truthful 429 with Retry-After.
  const rateLimit = await guardRouteHandler("ai.request", request);
  if (!rateLimit.ok) return rateLimit.response;

  let body: AssistantRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const message = sanitizeMessage(body.message);

  if (!message) {
    return NextResponse.json(
      {
        error: "Ask me a SKXNZ shopping question first.",
      },
      { status: 400 },
    );
  }

  if (message.length > skxnzAssistantLimits.maxMessageLength) {
    return NextResponse.json(
      {
        error: `Keep messages under ${skxnzAssistantLimits.maxMessageLength} characters so I can stay focused on SKXNZ shopping.`,
      },
      { status: 400 },
    );
  }

  const catalog = await loadAssistantCatalog();
  if (!catalog) {
    return NextResponse.json(
      { error: "The SKXNZ catalogue is unavailable right now. Please try again shortly." },
      { status: 503 },
    );
  }

  const result = createSkxnzAssistantResponse(
    message,
    catalog,
    sanitizeAssistantContext(body.context),
  );

  return NextResponse.json(result);
}

/** The live catalogue the assistant may recommend from. null = catalogue error
 * (logged in lib/catalog/public-catalog); demo data only via the demo switch. */
async function loadAssistantCatalog(): Promise<AssistantCatalog | null> {
  const [products, brands, categories] = await Promise.all([
    listActiveProducts(),
    listActiveBrands(),
    listActiveCategories(),
  ]);

  if (products.ok && brands.ok && categories.ok) {
    return {
      products: products.data.map(mapCatalogProductToBuyerProduct),
      brands: brands.data.map((brand) => ({ slug: brand.slug, name: brand.name })),
      categorySlugs: categories.data.map((category) => category.slug),
    };
  }

  return isDemoCatalogueEnabled() ? demoAssistantCatalog : null;
}
