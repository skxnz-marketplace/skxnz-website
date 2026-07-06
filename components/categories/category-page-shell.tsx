"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductGrid } from "@/components/shared/product-grid";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatProductPrice, type Product } from "@/lib/data/products";
import { structuredCategories, type StructuredCategory } from "@/src/data/categories";
import { ensureCategoryAsset, skxnzFallbackAssets } from "@/src/lib/assets";
import {
  getCategoryPageHref,
  normalizeCatalogValue,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";

type CategoryPageShellProps = {
  category: StructuredCategory | null;
  /** Live ACTIVE products for this category; when set, replaces the demo
   * catalog signal-matching path entirely. */
  liveProducts?: Product[];
};

type CategorySort = "Featured" | "Newest" | "Price low to high" | "Price high to low" | "Limited edition";
type PriceBand = "All" | "Under ₹2,500" | "₹2,500–₹4,000" | "₹4,000–₹6,000" | "₹6,000+";

const sortOptions: CategorySort[] = [
  "Featured",
  "Newest",
  "Price low to high",
  "Price high to low",
  "Limited edition",
];

const priceBands: PriceBand[] = [
  "All",
  "Under ₹2,500",
  "₹2,500–₹4,000",
  "₹4,000–₹6,000",
  "₹6,000+",
];

const fieldClassName =
  "field-shell w-full min-w-0 rounded-full px-4 py-3 text-sm";

function normalizeSignal(value: string) {
  return normalizeCatalogValue(value).replace(/[-_]+/g, " ");
}

function productSignals(product: Product) {
  return uniqueNonEmpty([
    product.name,
    product.brandName,
    product.brandSlug,
    product.category,
    product.subcategory,
    product.subtitle,
    product.description,
    product.shortDescription,
    product.fit,
    product.fabric,
    product.seller,
    ...product.features,
    ...product.materials,
    ...product.sizes,
    ...product.colors,
    ...product.tags,
    ...product.collections,
    ...product.searchAliases,
  ]).map(normalizeSignal);
}

function hasSignal(product: Product, signals: string[]) {
  const values = productSignals(product);
  const normalizedSignals = signals.map(normalizeSignal);

  return normalizedSignals.some((signal) =>
    values.some((value) => {
      if (signal.length <= 3 || value.length <= 3) {
        return value === signal;
      }

      return value === signal || value.includes(signal) || signal.includes(value);
    }),
  );
}

function isProductNewSeason(product: Product) {
  return hasSignal(product, ["new season", "new collection", "fresh drops"]);
}

function isProductAIStyled(product: Product) {
  return hasSignal(product, ["ai styled", "ai stylised", "ai fashion", "digital fashion"]);
}

function isProductLimitedEdition(product: Product) {
  return hasSignal(product, ["limited edition", "limited drops", "limited", "exclusive", "rare"]);
}

function isProductFeatured(product: Product) {
  return hasSignal(product, ["featured", "wear the signal", "premium", "homepage", "top pick"]);
}

function productMatchesCategory(product: Product, category: StructuredCategory) {
  if (category.slug === "new-season") return isProductNewSeason(product);
  if (category.slug === "ai-stylised") return isProductAIStyled(product);
  if (category.slug === "limited-edition") return isProductLimitedEdition(product);

  const normalizedCategoryValues = [
    category.name,
    category.displayName,
    category.slug,
    ...category.searchKeywords,
  ].map(normalizeSignal);
  const values = productSignals(product);

  return normalizedCategoryValues.some((categoryValue) =>
    values.some((value) => {
      if (categoryValue.length <= 3 || value.length <= 3) {
        return value === categoryValue;
      }

      return value === categoryValue || value.includes(categoryValue);
    }),
  );
}

function matchesPriceBand(price: number, band: PriceBand) {
  if (band === "All") return true;
  if (band === "Under ₹2,500") return price < 2500;
  if (band === "₹2,500–₹4,000") return price >= 2500 && price <= 4000;
  if (band === "₹4,000–₹6,000") return price > 4000 && price <= 6000;
  return price > 6000;
}

function getSimilarCategories(category: StructuredCategory) {
  const currentSignals = new Set(
    [category.name, category.displayName, ...category.searchKeywords].map(normalizeSignal),
  );

  return structuredCategories
    .filter((entry) => entry.slug !== category.slug)
    .map((entry) => {
      const score = [entry.name, entry.displayName, ...entry.searchKeywords]
        .map(normalizeSignal)
        .filter((signal) => currentSignals.has(signal)).length;

      return { category: entry, score };
    })
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.category.displayOrder - right.category.displayOrder;
    })
    .slice(0, 4)
    .map((entry) => entry.category);
}

function sortCategoryProducts(products: Product[], sort: CategorySort) {
  return [...products].sort((left, right) => {
    if (sort === "Price low to high") return left.price - right.price;
    if (sort === "Price high to low") return right.price - left.price;
    if (sort === "Newest") return right.updatedAt.localeCompare(left.updatedAt);
    if (sort === "Limited edition") {
      return Number(isProductLimitedEdition(right)) - Number(isProductLimitedEdition(left));
    }

    return Number(isProductFeatured(right)) - Number(isProductFeatured(left));
  });
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 rounded-[20px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)] px-4 py-3 text-sm font-bold text-midnightbrown">
      <span className="line-clamp-1">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[var(--skxnz-maroon)]"
      />
    </label>
  );
}

function FeaturedProductStrip({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal">
            Featured
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold uppercase text-midnightbrown sm:text-2xl">
            Start here
          </h2>
        </div>
        <Badge>{products.length} featured</Badge>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group w-[13.5rem] overflow-hidden rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] shadow-[0_12px_30px_rgba(58,8,24,0.06)]"
            >
              <div className="relative h-36 overflow-hidden bg-[var(--skxnz-bg-soft)]">
                <SafeImage
                  src={product.image}
                  fallbackSrc={skxnzFallbackAssets.product}
                  alt={product.name}
                  fill
                  sizes="272px"
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="min-w-0 p-3">
                <p className="line-clamp-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-teal">
                  {product.brandName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-midnightbrown">
                  {product.name}
                </p>
                <p className="mt-1 text-sm font-bold text-sangria">
                  {formatProductPrice(product.salePrice ?? product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryPageShell({ category, liveProducts }: CategoryPageShellProps) {
  const { approvedProducts, isHydrated } = useMarketplace();
  const isLiveCategory = liveProducts != null;
  const [brand, setBrand] = useState("All");
  const [priceBand, setPriceBand] = useState<PriceBand>("All");
  const [size, setSize] = useState("All");
  const [color, setColor] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [sort, setSort] = useState<CategorySort>("Featured");
  const [newSeasonOnly, setNewSeasonOnly] = useState(false);
  const [limitedOnly, setLimitedOnly] = useState(false);
  const [aiStyledOnly, setAIStyledOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const baseCategoryProducts = useMemo(() => {
    if (isLiveCategory) return liveProducts ?? [];
    if (!category) return [] as Product[];

    return approvedProducts.filter((product) => productMatchesCategory(product, category));
  }, [approvedProducts, category, isLiveCategory, liveProducts]);

  const brandOptions = useMemo(
    () =>
      Array.from(
        new Map(
          baseCategoryProducts.map((product) => [
            product.brandSlug,
            { slug: product.brandSlug, name: product.brandName },
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [baseCategoryProducts],
  );
  const subcategoryOptions = useMemo(
    () =>
      uniqueNonEmpty(baseCategoryProducts.map((product) => product.subcategory)).sort(),
    [baseCategoryProducts],
  );
  const sizeOptions = useMemo(
    () => uniqueNonEmpty(baseCategoryProducts.flatMap((product) => product.sizes)).sort(),
    [baseCategoryProducts],
  );
  const colorOptions = useMemo(
    () => uniqueNonEmpty(baseCategoryProducts.flatMap((product) => product.colors)).sort(),
    [baseCategoryProducts],
  );
  const similarCategories = useMemo(
    () => (category ? getSimilarCategories(category) : []),
    [category],
  );

  const filteredProducts = useMemo(() => {
    const nextProducts = baseCategoryProducts.filter((product) => {
      const matchesBrand = brand === "All" || product.brandSlug === brand;
      const matchesPrice = matchesPriceBand(product.price, priceBand);
      const matchesSize = size === "All" || product.sizes.includes(size);
      const matchesColor = color === "All" || product.colors.includes(color);
      const matchesSubcategory =
        subcategory === "All" || product.subcategory === subcategory;
      const matchesNewSeason = !newSeasonOnly || isProductNewSeason(product);
      const matchesLimited = !limitedOnly || isProductLimitedEdition(product);
      const matchesAIStyled = !aiStyledOnly || isProductAIStyled(product);
      const matchesFeatured = !featuredOnly || isProductFeatured(product);

      return (
        matchesBrand &&
        matchesPrice &&
        matchesSize &&
        matchesColor &&
        matchesSubcategory &&
        matchesNewSeason &&
        matchesLimited &&
        matchesAIStyled &&
        matchesFeatured
      );
    });

    return sortCategoryProducts(nextProducts, sort);
  }, [
    aiStyledOnly,
    baseCategoryProducts,
    brand,
    color,
    featuredOnly,
    limitedOnly,
    newSeasonOnly,
    priceBand,
    size,
    sort,
    subcategory,
  ]);

  const featuredStripProducts = useMemo(
    () => sortCategoryProducts(baseCategoryProducts, "Featured").slice(0, 5),
    [baseCategoryProducts],
  );

  if (!category) {
    return (
      <div className="bg-[var(--skxnz-bg)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Category not found."
            description="This category is not available in the current SKXNZ buyer preview."
            actionHref="/shop"
            actionLabel="Back To Shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--skxnz-bg)] pb-14">
      <section className="relative w-full overflow-hidden border-b border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-obsidian)] text-[var(--skxnz-text-light)]">
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-[360px]">
          <SafeImage
            src={ensureCategoryAsset(category.image, category.slug)}
            fallbackSrc={skxnzFallbackAssets.category}
            alt={category.displayName}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,6,0.92)_0%,rgba(26,3,11,0.78)_34%,rgba(16,0,6,0.34)_70%,rgba(16,0,6,0.16)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_18%_80%,rgba(217,70,239,0.10),transparent_32%)]" />

          <div className="relative z-10 mx-auto flex min-h-[300px] max-w-7xl flex-col justify-end px-4 py-8 sm:px-6 lg:min-h-[360px] lg:px-8 lg:py-10">
            <div className="max-w-2xl">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[var(--skxnz-glint)]">
                Category landing
              </p>
              <h1 className="mt-4 max-w-[12ch] break-words font-display text-[2.2rem] font-semibold uppercase leading-[0.98] tracking-[-0.02em] sm:text-5xl">
                {category.displayName}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/78">
                {category.description}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="#category-products"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  Shop Products
                </Link>
                <Link
                  href="/shop"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                    className: "border-white/20 bg-white/90 text-sangria",
                  })}
                >
                  Shop All
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <FeaturedProductStrip products={featuredStripProducts} />

        <Card className="rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4 shadow-[0_14px_36px_rgba(58,8,24,0.06)] sm:p-5">
          <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr] xl:items-end">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal">
                Controls
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold uppercase text-midnightbrown sm:text-2xl">
                Filter the signal
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone">
                {isLiveCategory
                  ? "Filter live SKXNZ catalog products by brand, price, size, color, and signal."
                  : "Filter central demo products by brand, price, size, color, and signal."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Brand
                </span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  <option value="All">All brands</option>
                  {brandOptions.map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Price
                </span>
                <select
                  value={priceBand}
                  onChange={(event) => setPriceBand(event.target.value as PriceBand)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  {priceBands.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Sort
                </span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CategorySort)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Size
                </span>
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  <option>All</option>
                  {sizeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Color
                </span>
                <select
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  <option>All</option>
                  {colorOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                  Subcategory
                </span>
                <select
                  value={subcategory}
                  onChange={(event) => setSubcategory(event.target.value)}
                  className={cn(fieldClassName, "mt-2")}
                >
                  <option>All</option>
                  {subcategoryOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <FilterToggle
              label="New Season"
              checked={newSeasonOnly}
              onChange={(event) => setNewSeasonOnly(event.target.checked)}
            />
            <FilterToggle
              label="Limited Edition"
              checked={limitedOnly}
              onChange={(event) => setLimitedOnly(event.target.checked)}
            />
            <FilterToggle
              label="AI Styled"
              checked={aiStyledOnly}
              onChange={(event) => setAIStyledOnly(event.target.checked)}
            />
            <FilterToggle
              label="Featured"
              checked={featuredOnly}
              onChange={(event) => setFeaturedOnly(event.target.checked)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{filteredProducts.length} products</Badge>
            <Badge>{brand === "All" ? "All brands" : brandOptions.find((entry) => entry.slug === brand)?.name ?? brand}</Badge>
            <Badge>{priceBand}</Badge>
            <Badge>{sort}</Badge>
            {category.searchKeywords.slice(0, 4).map((keyword) => (
              <Badge key={keyword}>{keyword}</Badge>
            ))}
          </div>
        </Card>

        <section id="category-products" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal">
                Category products
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold uppercase text-midnightbrown sm:text-2xl">
                {category.displayName} Preview
              </h2>
            </div>
            <Badge>{baseCategoryProducts.length} total matches</Badge>
          </div>

          {!isLiveCategory && !isHydrated && filteredProducts.length === 0 ? (
            <EmptyState
              title="Loading local category preview."
              description="SKXNZ is checking the browser-local catalog before showing the final category product set."
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              emptyTitle={`No ${category.displayName.toLowerCase()} products match these filters.`}
              emptyDescription={
                isLiveCategory
                  ? "Try a broader brand, price, size, color, or signal filter."
                  : "Try a broader brand, price, size, color, or signal filter. Category pages are powered by local demo catalog data right now."
              }
              showWishlistAction
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal">
              Similar categories
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold uppercase text-midnightbrown sm:text-2xl">
              Keep browsing
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similarCategories.map((entry) => (
              <Link
                key={entry.id}
                href={getCategoryPageHref(entry.slug)}
                className="group min-w-0 overflow-hidden rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] shadow-[0_12px_30px_rgba(58,8,24,0.06)]"
              >
                <div className="relative h-32 overflow-hidden">
                  <SafeImage
                    src={ensureCategoryAsset(entry.image, entry.slug)}
                    fallbackSrc={skxnzFallbackAssets.category}
                    alt={entry.displayName}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,0,6,0.08),rgba(16,0,6,0.72))]" />
                  <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--skxnz-text-light)]">
                    {entry.displayName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
