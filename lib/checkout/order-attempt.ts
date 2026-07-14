import type { CreateOrderIntentResult } from "@/lib/orders/create-order-intent";

export type CheckoutAttemptView =
  | { kind: "ready" }
  | { kind: "created"; title: string; message: string }
  | { kind: "recovered"; title: string; message: string }
  | {
      kind:
        | "address"
        | "auth"
        | "conflict"
        | "invalid"
        | "not-wired"
        | "retryable"
        | "stock"
        | "unavailable";
      title: string;
      message: string;
      retryable: boolean;
    };

export function resolveCheckoutAttempt(
  result: CreateOrderIntentResult,
): CheckoutAttemptView {
  if (result.ok) {
    return result.reused
      ? {
          kind: "recovered",
          title: "Draft recovered",
          message: "Your earlier unpaid draft is ready. No payment was taken.",
        }
      : {
          kind: "created",
          title: "Draft created",
          message: "Your unpaid draft is ready. No payment was taken.",
        };
  }

  switch (result.code) {
    case "UNAUTHENTICATED":
      return {
        kind: "auth",
        title: "Sign in again",
        message: "Your session ended before the draft could be saved. Your cart is unchanged.",
        retryable: false,
      };
    case "ADDRESS_REQUIRED":
      return {
        kind: "address",
        title: "Check your delivery address",
        message: "Select a current saved address, then try again. Nothing was charged.",
        retryable: false,
      };
    case "OUT_OF_STOCK":
      return {
        kind: "stock",
        title: "Stock changed",
        message: "One or more quantities are no longer available. Review your cart before trying again.",
        retryable: false,
      };
    case "PRODUCT_UNAVAILABLE":
      return {
        kind: "unavailable",
        title: "An item changed",
        message: "An item or selected option is no longer available. Review your cart before trying again.",
        retryable: false,
      };
    case "IDEMPOTENCY_CONFLICT":
      return {
        kind: "conflict",
        title: "Checkout details changed",
        message: "This attempt no longer matches your cart. Review it, then start a new checkout attempt.",
        retryable: false,
      };
    case "NOT_WIRED":
      return {
        kind: "not-wired",
        title: "Draft checkout is not ready",
        message: "We cannot save an order draft yet. Your cart is unchanged and no payment was taken.",
        retryable: false,
      };
    case "VALIDATION_FAILED":
    case "FORBIDDEN":
      return {
        kind: "invalid",
        title: "Review your checkout",
        message: "We could not use these checkout details. Review your cart and address before trying again.",
        retryable: false,
      };
    case "DB_ERROR":
      return {
        kind: "retryable",
        title: "Draft not saved",
        message: "We could not save your draft this time. Nothing was charged. Try again when you are ready.",
        retryable: true,
      };
  }
}

export function checkoutAttemptKey(
  currentKey: string,
  action: "retry" | "new-attempt",
  createKey: () => string,
): string {
  return action === "new-attempt" ? createKey() : currentKey;
}
