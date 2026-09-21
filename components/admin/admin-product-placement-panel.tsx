"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminSetProductFeatured,
  adminSetProductLimited,
  adminSetTrendingOrder,
} from "@/lib/catalog/admin-placement-actions";

type AdminProductPlacementPanelProps = {
  productId: string;
  initialIsFeatured: boolean;
  initialIsLimited: boolean;
  initialTrendingOrder: number | null;
};

export function AdminProductPlacementPanel({
  productId,
  initialIsFeatured,
  initialIsLimited,
  initialTrendingOrder,
}: AdminProductPlacementPanelProps) {
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured);
  const [isLimited, setIsLimited] = useState(initialIsLimited);
  const [trendingOrderInput, setTrendingOrderInput] = useState(
    initialTrendingOrder === null ? "" : String(initialTrendingOrder),
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleFeatured = () => {
    const next = !isFeatured;
    setIsFeatured(next);
    startTransition(async () => {
      const result = await adminSetProductFeatured(productId, next);
      if (!result.ok) {
        setIsFeatured(!next);
        setMessage(result.message);
      }
    });
  };

  const toggleLimited = () => {
    const next = !isLimited;
    setIsLimited(next);
    startTransition(async () => {
      const result = await adminSetProductLimited(productId, next);
      if (!result.ok) {
        setIsLimited(!next);
        setMessage(result.message);
      }
    });
  };

  const saveTrendingOrder = () => {
    const trimmed = trendingOrderInput.trim();
    const order = trimmed === "" ? null : Number(trimmed);
    if (order !== null && (!Number.isInteger(order) || order < 0)) {
      setMessage("Order must be a non-negative whole number, or blank to remove.");
      return;
    }
    startTransition(async () => {
      const result = await adminSetTrendingOrder(productId, order);
      setMessage(result.ok ? "Saved." : result.message);
    });
  };

  return (
    <Card className="section-border rounded-[32px] p-6 sm:p-8">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        Placement
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
        Featured, limited, and homepage placement.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-silver">
        Trending order controls homepage Trending Now — lower numbers show
        first. Leave blank to let it fall back to newest-first.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          variant={isFeatured ? "primary" : "secondary"}
          disabled={isPending}
          onClick={toggleFeatured}
        >
          {isFeatured ? "Featured" : "Mark Featured"}
        </Button>
        <Button
          type="button"
          variant={isLimited ? "primary" : "secondary"}
          disabled={isPending}
          onClick={toggleLimited}
        >
          {isLimited ? "Limited" : "Mark Limited"}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-silver">
            Trending Now order
          </span>
          <input
            type="number"
            min={0}
            value={trendingOrderInput}
            onChange={(event) => setTrendingOrderInput(event.target.value)}
            placeholder="Not placed"
            className="field-shell w-40 rounded-[14px] px-3 py-2.5 text-sm"
          />
        </label>
        <Button type="button" disabled={isPending} onClick={saveTrendingOrder}>
          Save order
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
