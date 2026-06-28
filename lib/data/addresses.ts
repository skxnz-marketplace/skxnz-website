import type { Address } from "@/lib/types/skxnz-data";

export const demoAddressesStorageKey = "skxnz-demo-addresses";
export const demoBuyerUserId = "demo_buyer_user";

export type DemoAddressInput = {
  label?: string;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export const emptyDemoAddressInput: DemoAddressInput = {
  label: "Home",
  fullName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

function createTimestamp() {
  return new Date().toISOString();
}

function createAddressId() {
  return `demo_address_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function normalizeAddressInput(input: DemoAddressInput): DemoAddressInput {
  return {
    label: input.label?.trim() || "Demo address",
    fullName: input.fullName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || "",
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim() || "India",
    isDefault: input.isDefault,
  };
}

export function isDemoAddressValid(input: DemoAddressInput) {
  const address = normalizeAddressInput(input);

  return Boolean(
    address.fullName &&
      address.phoneNumber &&
      address.line1 &&
      address.city &&
      address.state &&
      address.postalCode &&
      address.country,
  );
}

export function normalizeAddressList(addresses: Address[]) {
  if (addresses.length <= 1) {
    return addresses.map((address) => ({ ...address, isDefault: true }));
  }

  const defaultIndex = addresses.findIndex((address) => address.isDefault);

  if (defaultIndex === -1) {
    return addresses.map((address, index) => ({
      ...address,
      isDefault: index === 0,
    }));
  }

  return addresses.map((address, index) => ({
    ...address,
    isDefault: index === defaultIndex,
  }));
}

export function getDemoAddresses() {
  if (typeof window === "undefined") {
    return [] as Address[];
  }

  try {
    const storedValue = window.localStorage.getItem(demoAddressesStorageKey);

    if (!storedValue) {
      return [] as Address[];
    }

    return normalizeAddressList(JSON.parse(storedValue) as Address[]);
  } catch {
    return [] as Address[];
  }
}

export function saveDemoAddresses(addresses: Address[]) {
  const nextAddresses = normalizeAddressList(addresses);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      demoAddressesStorageKey,
      JSON.stringify(nextAddresses),
    );
  }

  return nextAddresses;
}

export function createDemoAddress(
  input: DemoAddressInput,
  currentAddresses = getDemoAddresses(),
) {
  const now = createTimestamp();
  const normalizedInput = normalizeAddressInput(input);
  const shouldBeDefault = normalizedInput.isDefault || currentAddresses.length === 0;
  const nextAddress: Address = {
    id: createAddressId(),
    userId: demoBuyerUserId,
    label: normalizedInput.label,
    fullName: normalizedInput.fullName,
    phoneNumber: normalizedInput.phoneNumber,
    line1: normalizedInput.line1,
    line2: normalizedInput.line2 || null,
    city: normalizedInput.city,
    state: normalizedInput.state,
    postalCode: normalizedInput.postalCode,
    country: normalizedInput.country,
    isDefault: shouldBeDefault,
    createdAt: now,
    updatedAt: now,
  };

  return saveDemoAddresses([
    nextAddress,
    ...currentAddresses.map((address) => ({
      ...address,
      isDefault: shouldBeDefault ? false : address.isDefault,
    })),
  ]);
}

export function updateDemoAddress(
  addressId: string,
  input: DemoAddressInput,
  currentAddresses = getDemoAddresses(),
) {
  const normalizedInput = normalizeAddressInput(input);
  const now = createTimestamp();
  const nextAddresses = currentAddresses.map((address) =>
    address.id === addressId
      ? {
          ...address,
          label: normalizedInput.label,
          fullName: normalizedInput.fullName,
          phoneNumber: normalizedInput.phoneNumber,
          line1: normalizedInput.line1,
          line2: normalizedInput.line2 || null,
          city: normalizedInput.city,
          state: normalizedInput.state,
          postalCode: normalizedInput.postalCode,
          country: normalizedInput.country,
          isDefault: normalizedInput.isDefault,
          updatedAt: now,
        }
      : {
          ...address,
          isDefault: normalizedInput.isDefault ? false : address.isDefault,
        },
  );

  return saveDemoAddresses(nextAddresses);
}

export function removeDemoAddress(
  addressId: string,
  currentAddresses = getDemoAddresses(),
) {
  return saveDemoAddresses(
    currentAddresses.filter((address) => address.id !== addressId),
  );
}

export function setDefaultDemoAddress(
  addressId: string,
  currentAddresses = getDemoAddresses(),
) {
  return saveDemoAddresses(
    currentAddresses.map((address) => ({
      ...address,
      isDefault: address.id === addressId,
      updatedAt:
        address.id === addressId ? createTimestamp() : address.updatedAt,
    })),
  );
}

export function getDefaultDemoAddress(addresses = getDemoAddresses()) {
  return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
}

export function addressToSingleLine(address: Address) {
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}
