import type {
  Address,
  SkxnzUserRole,
  UserProfile,
} from "@/lib/types/skxnz-data";

export const demoRoleStorageKey = "skxnz-demo-role";
export const demoBuyerProfileStorageKey = "skxnz-demo-buyer-profile";

export type AuthConnectionStatus =
  | "demo-role-only"
  | "auth-provider-planned"
  | "auth-provider-connected";

export type UserDataReadiness = {
  auth: AuthConnectionStatus;
  canPersistPrivateUserData: boolean;
  notes: string[];
};

export type DemoBuyerProfileSettings = {
  name: string;
  email: string;
  phone: string;
  city: string;
  preferredCategory: string;
  favouriteBrands: string;
  favouriteColors: string;
  styleVibe: string;
  budgetRange: string;
  sizePreferences: string;
  interestedInDrops: boolean;
  interestedInAiStyling: boolean;
  updatedAt: string;
};

export const defaultDemoBuyerProfileSettings: DemoBuyerProfileSettings = {
  name: "Demo Buyer",
  email: "demo-buyer@skxnz.local",
  phone: "",
  city: "Mumbai",
  preferredCategory: "Streetwear",
  favouriteBrands: "SKXNZ, Atelier Nova, Chrome District",
  favouriteColors: "Black, Chrome, Pearl",
  styleVibe: "Futurewear, clean street-luxury, chrome accents",
  budgetRange: "₹8,000 - ₹30,000",
  sizePreferences: "Relaxed tops, tapered bottoms, true-to-size footwear",
  interestedInDrops: true,
  interestedInAiStyling: true,
  updatedAt: new Date(0).toISOString(),
};

export function getCurrentUserDataReadiness(): UserDataReadiness {
  return {
    auth: "demo-role-only",
    canPersistPrivateUserData: false,
    notes: [
      "Real authentication is not connected yet.",
      "Do not store passwords manually.",
      "Do not store private user data in Google Sheets or Excel.",
    ],
  };
}

export function createDemoUserProfile(role: SkxnzUserRole): UserProfile {
  const now = new Date().toISOString();

  return {
    id: `demo_${role.toLowerCase()}_profile`,
    userId: `demo_${role.toLowerCase()}_user`,
    role,
    name: role === "BUYER" ? "Demo Buyer" : `Demo ${role}`,
    email: `demo-${role.toLowerCase()}@skxnz.local`,
    phoneNumber: null,
    avatarUrl: null,
    city: null,
    state: null,
    country: "India",
    stylePreference: null,
    preferredFit: null,
    budgetRange: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isAddressComplete(address: Partial<Address>) {
  return Boolean(
    address.fullName?.trim() &&
      address.phoneNumber?.trim() &&
      address.line1?.trim() &&
      address.city?.trim() &&
      address.postalCode?.trim(),
  );
}

export function getDemoUserProfile() {
  if (typeof window === "undefined") {
    return defaultDemoBuyerProfileSettings;
  }

  try {
    const storedValue = window.localStorage.getItem(demoBuyerProfileStorageKey);

    if (!storedValue) {
      return defaultDemoBuyerProfileSettings;
    }

    return {
      ...defaultDemoBuyerProfileSettings,
      ...(JSON.parse(storedValue) as Partial<DemoBuyerProfileSettings>),
    };
  } catch {
    return defaultDemoBuyerProfileSettings;
  }
}

export function updateDemoUserProfile(
  profile: DemoBuyerProfileSettings,
) {
  const nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      demoBuyerProfileStorageKey,
      JSON.stringify(nextProfile),
    );
  }

  return nextProfile;
}
