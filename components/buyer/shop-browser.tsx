"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { ProductGrid } from "@/components/shared/product-grid";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Product } from "@/lib/data/products";
import { filterProductsBySearch, normalizeSearchQuery } from "@/src/lib/site-search";

type ShopBrowserProps = {
  products: Product[];
  categories: string[];
  sizes: string[];
  colors: string[];
  brands: Array<{
    slug: string;
    name: string;
  }>;
  initialBrandSlug?: string;
  initialQuery?: string;
};

type PriceBand = "All" | "Under $150" | "$150-$250" | "$250-$350" | "$350+";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[18px] px-4 py-3 text-sm";

const priceBands: PriceBand[] = [
  "All",
  "Under $150",
  "$150-$250",
  "$250-$350",
  "$350+",
];

const unknownBrandValue = "__unknown_brand__";

const matchesPriceBand = (price: number, band: PriceBand) => {
  if (band === "All") {
    return true;
  }

  if (band === "Under $150") {
    return price < 150;
  }

  if (band === "$150-$250") {
    return price >= 150 && price <= 250;
  }

  if (band === "$250-$350") {
    return price > 250 && price <= 350;
  }

  return price > 350;
};

export function ShopBrowser({
  products,
  categories,
  sizes,
  colors,
  brands,
  initialBrandSlug,
  initialQuery,
}: ShopBrowserProps) {
  const requestedBrand = normalizeSearchQuery(initialBrandSlug ?? "");
  const matchedRequestedBrand = requestedBrand
    ? brands.find((brandOption) => normalizeSearchQuery(brandOption.slug) === requestedBrand)
    : undefined;
  const unresolvedRequestedBrand = Boolean(requestedBrand && !matchedRequestedBrand);
  const normalizedQuery = normalizeSearchQuery(initialQuery ?? "");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState(
    matchedRequestedBrand?.slug ?? (unresolvedRequestedBrand ? unknownBrandValue : "All"),
  );
  const [size, setSize] = useState("All");
  const [color, setColor] = useState("All");
  const [priceBand, setPriceBand] = useState<PriceBand>("All");

  useEffect(() => {
    setBrand(matchedRequestedBrand?.slug ?? (unresolvedRequestedBrand ? unknownBrandValue : "All"));
  }, [matchedRequestedBrand?.slug, unresolvedRequestedBrand]);

  const searchMatchedProducts = filterProductsBySearch(products, normalizedQuery);
  const filteredProducts = searchMatchedProducts.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesBrand =
      brand === "All" ? true : brand !== unknownBrandValue && product.brandSlug === brand;
    const matchesSize = size === "All" || product.sizes.includes(size);
    const matchesColor = color === "All" || product.colors.includes(color);
    const matchesPrice = matchesPriceBand(product.price, priceBand);

    return (
      matchesCategory &&
      matchesBrand &&
      matchesSize &&
      matchesColor &&
      matchesPrice
    );
  });

  const handleSelect =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setter(event.target.value);
    };

  return (
    <div className="space-y-5">
      <Card className="section-border rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-teal">
              Filters
            </p>
            <p className="mt-2 text-wrap-safe break-words text-sm leading-6 text-silver">
              Filter the local demo catalog by category, brand, size, color, and price.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                Category
              </span>
              <select
                value={category}
                onChange={handleSelect(setCategory)}
                className={fieldClassName}
              >
                <option>All</option>
                {categories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                Brand
              </span>
              <select
                value={brand}
                onChange={handleSelect(setBrand)}
                className={fieldClassName}
              >
                <option value="All">All</option>
                {unresolvedRequestedBrand ? (
                  <option value={unknownBrandValue}>Unknown brand: {requestedBrand}</option>
                ) : null}
                {brands.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                Size
              </span>
              <select
                value={size}
                onChange={handleSelect(setSize)}
                className={fieldClassName}
              >
                <option>All</option>
                {sizes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                Color
              </span>
              <select
                value={color}
                onChange={handleSelect(setColor)}
                className={fieldClassName}
              >
                <option>All</option>
                {colors.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                Price Range
              </span>
              <select
                value={priceBand}
                onChange={(event) => setPriceBand(event.target.value as PriceBand)}
                className={fieldClassName}
              >
                {priceBands.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge>{filteredProducts.length} products</Badge>
            {normalizedQuery ? <Badge>Search: {normalizedQuery}</Badge> : null}
            <Badge>{category === "All" ? "All categories" : category}</Badge>
            <Badge>
              {brand === "All"
                ? "All brands"
                : brand === unknownBrandValue
                  ? `Unknown brand: ${requestedBrand}`
                  : brands.find((option) => option.slug === brand)?.name ?? brand}
            </Badge>
            <Badge>{size === "All" ? "All sizes" : size}</Badge>
            <Badge>{color === "All" ? "All colors" : color}</Badge>
            <Badge>{priceBand}</Badge>
          </div>
        </div>
      </Card>

      <ProductGrid
        products={filteredProducts}
        emptyTitle={normalizedQuery ? "No signal found." : "No products match this filter mix."}
        emptyDescription={
          normalizedQuery
            ? "Try another brand, category, or product."
            : "Try a broader size, color, or price range."
        }
        showWishlistAction
      />
    </div>
  );
}
