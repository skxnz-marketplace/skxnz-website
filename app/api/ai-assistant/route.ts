import { NextResponse } from "next/server";

import {
  createSkxnzAssistantResponse,
  skxnzAssistantLimits,
  type SkxnzAssistantContext,
} from "@/src/lib/skxnzAssistant";

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

  const result = createSkxnzAssistantResponse(
    message,
    sanitizeAssistantContext(body.context),
  );

  return NextResponse.json(result);
}
