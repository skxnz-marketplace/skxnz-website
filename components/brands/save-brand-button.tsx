"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isBrandSaved, toggleSavedBrand } from "@/lib/data/saved-brands";

type SaveBrandButtonProps = {
  brandSlug: string;
  compact?: boolean;
};

export function SaveBrandButton({
  brandSlug,
  compact = false,
}: SaveBrandButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setIsSaved(isBrandSaved(brandSlug));
  }, [brandSlug]);

  return (
    <Button
      type="button"
      variant={isSaved ? "secondary" : "primary"}
      size={compact ? "md" : "lg"}
      onClick={() => setIsSaved(toggleSavedBrand(brandSlug))}
      aria-pressed={isSaved}
      title="Saved locally for now. Persistent saved brands connect later."
    >
      {isHydrated && isSaved ? "Saved Locally" : "Save Brand"}
    </Button>
  );
}
