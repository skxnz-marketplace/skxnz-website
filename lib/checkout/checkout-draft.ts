// Browser-local checkout draft for the SKXNZ V1 checkout review foundation.
// This is NOT an order: no production order, no payment, no confirmation is
// created from this data. It only keeps buyer-entered details across refresh.

export const checkoutDraftStorageKey = "skxnz-checkout-draft";

export type CheckoutContact = {
  fullName: string;
  phone: string;
  email: string;
};

export type CheckoutAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type CheckoutDraft = {
  contact: CheckoutContact;
  address: CheckoutAddress;
  deliveryNote: string;
  updatedAt: string;
};

export type CheckoutDraftErrors = Partial<
  Record<
    | keyof CheckoutContact
    | Exclude<keyof CheckoutAddress, "line2" | "country">,
    string
  >
>;

export const emptyCheckoutDraft: CheckoutDraft = {
  contact: {
    fullName: "",
    phone: "",
    email: "",
  },
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  deliveryNote: "",
  updatedAt: "",
};

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[<>]/g, "").slice(0, maxLength);
}

export function readCheckoutDraft(): CheckoutDraft {
  if (typeof window === "undefined") {
    return emptyCheckoutDraft;
  }

  try {
    const rawValue = window.localStorage.getItem(checkoutDraftStorageKey);

    if (!rawValue) {
      return emptyCheckoutDraft;
    }

    const parsed = JSON.parse(rawValue) as Partial<CheckoutDraft>;

    return {
      contact: {
        fullName: sanitizeText(parsed.contact?.fullName, 120),
        phone: sanitizeText(parsed.contact?.phone, 20),
        email: sanitizeText(parsed.contact?.email, 160),
      },
      address: {
        line1: sanitizeText(parsed.address?.line1, 200),
        line2: sanitizeText(parsed.address?.line2, 200),
        city: sanitizeText(parsed.address?.city, 80),
        state: sanitizeText(parsed.address?.state, 80),
        pincode: sanitizeText(parsed.address?.pincode, 12),
        country: sanitizeText(parsed.address?.country, 80) || "India",
      },
      deliveryNote: sanitizeText(parsed.deliveryNote, 500),
      updatedAt: sanitizeText(parsed.updatedAt, 40),
    };
  } catch {
    return emptyCheckoutDraft;
  }
}

export function writeCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      checkoutDraftStorageKey,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Browser-local persistence is best-effort in this V1 foundation.
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(checkoutDraftStorageKey);
  } catch {
    // Ignore storage failures.
  }
}

export function validateCheckoutDraft(draft: CheckoutDraft): CheckoutDraftErrors {
  const errors: CheckoutDraftErrors = {};

  if (!draft.contact.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  const phoneDigits = draft.contact.phone.replace(/\D/g, "");

  if (!draft.contact.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!draft.contact.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!draft.address.line1.trim()) {
    errors.line1 = "Address line 1 is required.";
  }

  if (!draft.address.city.trim()) {
    errors.city = "City is required.";
  }

  if (!draft.address.state.trim()) {
    errors.state = "State is required.";
  }

  const pincodeDigits = draft.address.pincode.replace(/\D/g, "");

  if (!draft.address.pincode.trim()) {
    errors.pincode = "Pincode is required.";
  } else if (pincodeDigits.length < 4 || pincodeDigits.length > 10) {
    errors.pincode = "Enter a valid pincode.";
  }

  return errors;
}
