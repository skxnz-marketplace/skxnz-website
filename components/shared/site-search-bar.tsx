"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/cn";
import { demoBrands } from "@/src/data/demo-brands";
import { skxnzFallbackAssets } from "@/src/lib/assets";
import {
  buildSearchSuggestions,
  normalizeSearchQuery,
  type SearchSuggestion,
} from "@/src/lib/site-search";

type SiteSearchBarProps = {
  className?: string;
  focusSignal?: number;
  placeholder?: string;
  /** Header renders desktop and mobile placements concurrently for CSS layout.
   * Only the placement matching this viewport may run suggestion work. */
  surface?: "desktop" | "mobile";
};

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16 20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuggestionRow({
  suggestion,
  onSelect,
}: {
  suggestion: SearchSuggestion;
  onSelect: (href: string) => void;
}) {
  const fallbackSrc =
    suggestion.type === "brand"
      ? skxnzFallbackAssets.brand
      : suggestion.type === "category"
        ? skxnzFallbackAssets.category
        : skxnzFallbackAssets.product;

  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(suggestion.href);
      }}
      className="flex w-full min-w-0 items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-white/75"
    >
      {suggestion.image ? (
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[16px] border border-sandstone bg-pearlcream">
          <SafeImage
            src={suggestion.image}
            fallbackSrc={fallbackSrc}
            alt={suggestion.label}
            fill
            sizes="44px"
            className="object-cover object-center"
          />
        </span>
      ) : (
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-sandstone bg-pearlcream text-sangria">
          <SearchGlyph />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 block break-words font-medium uppercase tracking-[0.12em] text-midnightbrown">
          {suggestion.label}
        </span>
        <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.2em] text-stone">
          {suggestion.description}
        </span>
      </span>
    </button>
  );
}

export function SiteSearchBar({
  className,
  focusSignal = 0,
  placeholder = "Search products, brands, categories, and collections",
  surface,
}: SiteSearchBarProps) {
  const inputId = useId();
  const suggestionsId = `${inputId}-suggestions`;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { approvedProducts } = useMarketplace();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSurfaceActive, setIsSurfaceActive] = useState(surface == null);
  /** Live catalog product suggestions; null = live unavailable/failed → local fallback. */
  const [liveProductSuggestions, setLiveProductSuggestions] = useState<SearchSuggestion[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const urlQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    if (!surface) {
      setIsSurfaceActive(true);
      return;
    }

    const media = window.matchMedia(
      surface === "desktop" ? "(min-width: 768px)" : "(max-width: 767px)",
    );
    const updateSurface = () => setIsSurfaceActive(media.matches);

    updateSurface();
    media.addEventListener("change", updateSurface);
    return () => media.removeEventListener("change", updateSurface);
  }, [surface]);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (!isSurfaceActive || !focusSignal) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusSignal, isSurfaceActive]);

  const normalizedQuery = normalizeSearchQuery(query);

  useEffect(() => {
    if (!isSurfaceActive || normalizedQuery.length < 2) {
      setLiveProductSuggestions(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`suggestions request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
          live?: boolean;
          suggestions?: SearchSuggestion[];
        };

        // live=true means the catalog query ran (even with 0 rows) — honest
        // empty beats swapping in demo items for a term with no real matches.
        setLiveProductSuggestions(data.live ? data.suggestions ?? [] : null);
      } catch {
        if (!controller.signal.aborted) {
          setLiveProductSuggestions(null);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isSurfaceActive, normalizedQuery]);

  const suggestions = useMemo(() => {
    if (!isSurfaceActive) {
      return [];
    }

    const localSuggestions = buildSearchSuggestions({
      query,
      products: approvedProducts,
      brands: demoBrands,
      limit: 8,
    });

    if (liveProductSuggestions === null) {
      return localSuggestions;
    }

    // Live catalog reachable: live products replace local product rows;
    // brand/category/collection/page navigation suggestions stay local.
    const navigationSuggestions = localSuggestions.filter(
      (suggestion) => suggestion.type !== "product",
    );

    return [...liveProductSuggestions, ...navigationSuggestions]
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
  }, [approvedProducts, isSurfaceActive, liveProductSuggestions, query]);
  const shouldShowSuggestions =
    isSurfaceActive && isFocused && normalizedQuery.length > 0;

  const navigateToQuery = (nextQuery: string) => {
    const normalized = normalizeSearchQuery(nextQuery);

    if (!normalized) {
      router.push("/shop");
      return;
    }

    router.push(`/shop?q=${encodeURIComponent(normalized)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToQuery(query);
    setIsFocused(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      navigateToQuery(event.currentTarget.value);
      setIsFocused(false);
      return;
    }

    if (event.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const closeSuggestions = () => {
    window.setTimeout(() => setIsFocused(false), 100);
  };

  return (
    <div className={cn("relative z-[80]", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search products, brands, categories, collections, and tags
        </label>
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sangria">
          <SearchGlyph />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={closeSuggestions}
          placeholder={placeholder}
          className="field-shell h-12 w-full min-w-0 rounded-full pl-12 pr-4 text-sm text-midnightbrown shadow-[0_18px_36px_rgba(90,31,46,0.08)]"
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-controls={shouldShowSuggestions ? suggestionsId : undefined}
          aria-expanded={shouldShowSuggestions}
        />
      </form>

      {shouldShowSuggestions ? (
        <div
          id={suggestionsId}
          className="absolute inset-x-0 top-[calc(100%+0.7rem)] overflow-hidden rounded-[28px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-3 shadow-[0_24px_56px_rgba(35,31,27,0.12)] backdrop-blur-xl"
        >
          {suggestions.length > 0 ? (
            <div className="grid gap-1.5">
              {suggestions.map((suggestion) => (
                <SuggestionRow
                  key={`${suggestion.type}-${suggestion.href}`}
                  suggestion={suggestion}
                  onSelect={(href) => {
                    router.push(href);
                    setIsFocused(false);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-[var(--skxnz-border)] bg-white/80 px-4 py-4 text-sm leading-6 text-[var(--skxnz-text-muted)]">
              <span className="block font-semibold text-[var(--skxnz-text-dark)]">
                No signal found.
              </span>
              <span className="mt-1 block">
                Try another brand, category, or product.
              </span>
            </div>
          )}
        </div>
      ) : null}

      {pathname === "/shop" && normalizedQuery ? (
        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.2em] text-stone">
          Search active: {normalizedQuery}
        </p>
      ) : null}
    </div>
  );
}
