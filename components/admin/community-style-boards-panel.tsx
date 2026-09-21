"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminCreateStyleBoard,
  adminDeleteStyleBoard,
  adminSetStyleBoardPublished,
} from "@/lib/community/admin-community-actions";
import type { AdminStyleBoard } from "@/lib/community/admin-read-community";
import type { Product } from "@/lib/data/products";
import { cn } from "@/lib/cn";

type CommunityStyleBoardsPanelProps = {
  boards: AdminStyleBoard[];
  products: Product[];
};

const emptyDraft = {
  slug: "",
  title: "",
  description: "",
  imageUrl: "",
  tagsInput: "",
  productIds: [] as string[],
};

export function CommunityStyleBoardsPanel({ boards, products }: CommunityStyleBoardsPanelProps) {
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingBoardId, setPendingBoardId] = useState<string | null>(null);

  const productOptions = useMemo(() => products.slice(0, 24), [products]);

  const toggleProduct = (productId: string) => {
    setDraft((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId].slice(0, 12),
    }));
  };

  const submitCreate = () => {
    startTransition(async () => {
      const result = await adminCreateStyleBoard({
        slug: draft.slug,
        title: draft.title,
        description: draft.description,
        imageUrl: draft.imageUrl,
        tags: draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
        productIds: draft.productIds,
      });
      if (result.ok) {
        setDraft(emptyDraft);
        setMessage("Style board created.");
      } else {
        setMessage(result.message);
      }
    });
  };

  const togglePublish = (board: AdminStyleBoard) => {
    setPendingBoardId(board.id);
    startTransition(async () => {
      const result = await adminSetStyleBoardPublished(board.id, !board.isPublished);
      setMessage(result.ok ? "" : result.message);
      setPendingBoardId(null);
    });
  };

  const remove = (board: AdminStyleBoard) => {
    setPendingBoardId(board.id);
    startTransition(async () => {
      const result = await adminDeleteStyleBoard(board.id);
      setMessage(result.ok ? "" : result.message);
      setPendingBoardId(null);
    });
  };

  return (
    <Card className="section-border rounded-[32px] p-6 sm:p-8">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        Style Boards
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
        Curate and publish editorial boards.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-silver">
        Published boards show in the Community sidebar. Unpublished boards
        are saved but not visible to buyers.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">Slug</span>
          <input
            value={draft.slug}
            onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            placeholder="night-fits"
            className="field-shell rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">Title</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Night Fits"
            className="field-shell rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            rows={2}
            maxLength={400}
            placeholder="Dark, polished, and sharp enough for late plans."
            className="field-shell rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">Image URL</span>
          <input
            value={draft.imageUrl}
            onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))}
            placeholder="https://..."
            className="field-shell rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">Tags (comma-separated)</span>
          <input
            value={draft.tagsInput}
            onChange={(event) => setDraft((current) => ({ ...current, tagsInput: event.target.value }))}
            placeholder="#AllBlack, #DateNight"
            className="field-shell rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>

        <div className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">
            Products ({draft.productIds.length}/12)
          </span>
          <div className="grid max-h-48 gap-2 overflow-y-auto rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-2 sm:grid-cols-2">
            {productOptions.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleProduct(product.id)}
                className={cn(
                  "min-w-0 rounded-[12px] border px-3 py-2 text-left text-xs transition",
                  draft.productIds.includes(product.id)
                    ? "border-teal/50 bg-teal/10 text-pearl"
                    : "border-white/[0.08] bg-white/[0.02] text-silver",
                )}
              >
                <span className="line-clamp-1 font-semibold uppercase tracking-[0.08em]">
                  {product.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        className="mt-4"
        disabled={isPending || !draft.slug.trim() || !draft.title.trim()}
        onClick={submitCreate}
      >
        Create style board
      </Button>

      {message ? (
        <p className="mt-4 rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
          {message}
        </p>
      ) : null}

      <div className="mt-6 space-y-2">
        {boards.length === 0 ? (
          <p className="text-sm text-silver">No style boards yet.</p>
        ) : (
          boards.map((board) => (
            <div
              key={board.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-pearl">
                  {board.title}{" "}
                  <span className="text-xs font-normal text-silver">/{board.slug}</span>
                </p>
                <p className="text-xs text-silver">
                  {board.isPublished ? "Published" : "Unpublished"} · {board.productIds.length} products
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending && pendingBoardId === board.id}
                  onClick={() => togglePublish(board)}
                >
                  {board.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending && pendingBoardId === board.id}
                  onClick={() => remove(board)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
