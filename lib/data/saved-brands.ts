export const savedBrandsStorageKey = "skxnz-saved-brands-demo";

function readSavedBrandSlugs() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(savedBrandsStorageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSavedBrandSlugs(slugs: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    savedBrandsStorageKey,
    JSON.stringify(Array.from(new Set(slugs))),
  );
}

export function getSavedBrandSlugs() {
  return readSavedBrandSlugs();
}

export function isBrandSaved(brandSlug: string) {
  return readSavedBrandSlugs().includes(brandSlug);
}

export function saveBrand(brandSlug: string) {
  const savedSlugs = readSavedBrandSlugs();
  writeSavedBrandSlugs([...savedSlugs, brandSlug]);
}

export function removeSavedBrand(brandSlug: string) {
  writeSavedBrandSlugs(
    readSavedBrandSlugs().filter((savedSlug) => savedSlug !== brandSlug),
  );
}

export function toggleSavedBrand(brandSlug: string) {
  if (isBrandSaved(brandSlug)) {
    removeSavedBrand(brandSlug);
    return false;
  }

  saveBrand(brandSlug);
  return true;
}
