"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/data/products";
import type { CommunityPostDraft, CommunityVisibility } from "@/lib/types/community";
import { cn } from "@/lib/cn";

type CreatePostModalProps = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onSubmit: (draft: CommunityPostDraft) => void;
};

const defaultStyleTags = [
  "#Streetwear",
  "#AllBlack",
  "#ChromeFit",
  "#AIStyled",
  "#NewSeason",
  "#LimitedEdition",
  "#WearTheSignal",
];

export function CreatePostModal({
  isOpen,
  products,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [caption, setCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["#WearTheSignal"]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<CommunityVisibility>("Private Draft");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  const productOptions = useMemo(() => products.slice(0, 12), [products]);

  if (!isOpen) {
    return null;
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((entry) => entry !== tag)
        : [...currentTags, tag],
    );
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((currentProductIds) =>
      currentProductIds.includes(productId)
        ? currentProductIds.filter((entry) => entry !== productId)
        : [...currentProductIds, productId].slice(0, 4),
    );
  };

  const handleSubmit = () => {
    if (caption.trim().length < 12) {
      setError("Add a short caption so the demo post has context.");
      return;
    }

    if (selectedProductIds.length === 0) {
      setError("Tag at least one SKXNZ product for this MVP post.");
      return;
    }

    onSubmit({
      caption,
      styleTags: selectedTags.length > 0 ? selectedTags : ["#WearTheSignal"],
      taggedProductIds: selectedProductIds,
      visibility,
    });
    setCaption("");
    setSelectedTags(["#WearTheSignal"]);
    setSelectedProductIds([]);
    setVisibility("Private Draft");
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-signal-post-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-[rgba(255,254,250,0.14)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_30px_90px_rgba(16,0,6,0.38)] sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-glint)]">
              Signal Community Beta
            </p>
            <h2
              id="create-signal-post-title"
              className="mt-2 font-display text-3xl uppercase tracking-[0.08em]"
            >
              Create Post
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
              Uploads are placeholder-only in MVP. This creates a local demo post
              and does not publish publicly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white"
            aria-label="Close create post modal"
          >
            X
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Image upload placeholder
            </span>
            <input
              type="file"
              disabled
              className="rounded-[18px] border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-white/58"
            />
            <span className="text-xs leading-5 text-white/54">
              Real uploads require auth, storage, moderation, and admin tools.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Caption
            </span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={220}
              rows={4}
              placeholder="Describe the fit, mood, and tagged SKXNZ products..."
              className="min-h-28 rounded-[20px] border border-white/12 bg-white/[0.08] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/38 focus:border-[rgba(34,211,238,0.45)]"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Style tags
            </span>
            <div className="flex flex-wrap gap-2">
              {defaultStyleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-[0.66rem] font-black uppercase tracking-[0.16em] transition",
                    selectedTags.includes(tag)
                      ? "border-[rgba(34,211,238,0.48)] bg-[rgba(34,211,238,0.12)] text-white"
                      : "border-white/12 bg-white/[0.07] text-white/62",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Tagged SKXNZ products
            </span>
            <div className="grid max-h-56 gap-2 overflow-y-auto rounded-[20px] border border-white/12 bg-white/[0.06] p-2 sm:grid-cols-2">
              {productOptions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  className={cn(
                    "min-w-0 rounded-[16px] border px-3 py-3 text-left transition",
                    selectedProductIds.includes(product.id)
                      ? "border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-white/[0.06]",
                  )}
                >
                  <span className="line-clamp-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                    {product.name}
                  </span>
                  <span className="mt-1 block line-clamp-1 text-[0.68rem] text-white/56">
                    {product.brandName} · {product.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Visibility
            </span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as CommunityVisibility)
              }
              className="rounded-[18px] border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none"
            >
              <option className="text-black">Private Draft</option>
              <option className="text-black">Public Beta</option>
            </select>
            <span className="text-xs leading-5 text-white/54">
              Visibility is a demo label only. Public community posting is not live.
            </span>
          </label>

          {error ? (
            <p className="rounded-[18px] border border-[rgba(217,70,239,0.28)] bg-[rgba(217,70,239,0.10)] px-4 py-3 text-sm text-white">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Submit Demo Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
