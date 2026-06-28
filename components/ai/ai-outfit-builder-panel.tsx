"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { useDemoRole } from "@/components/auth/demo-role-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OutfitBuilderResponse } from "@/src/lib/ai/types";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

type OutfitBuilderPanelProps = {
  defaultPrompt?: string;
};

function getApiErrorMessage(payload: OutfitBuilderResponse | { message?: string }) {
  return "message" in payload && payload.message
    ? payload.message
    : "Outfit builder could not respond.";
}

export function AiOutfitBuilderPanel({
  defaultPrompt = "black oversized look",
}: OutfitBuilderPanelProps) {
  const { role } = useDemoRole();
  const [budget, setBudget] = useState("10000");
  const [occasion, setOccasion] = useState("streetwear weekend");
  const [style, setStyle] = useState("oversized premium");
  const [size, setSize] = useState("L");
  const [gender, setGender] = useState("Unisex");
  const [colorPreference, setColorPreference] = useState("Black");
  const [query, setQuery] = useState(defaultPrompt);
  const [response, setResponse] = useState<OutfitBuilderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const apiResponse = await fetch("/api/ai/outfit-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-skxnz-demo-role": role ?? "buyer",
        },
        body: JSON.stringify({
          budget: Number(budget),
          occasion,
          style,
          size,
          gender,
          colorPreference,
          query,
        }),
      });

      const payload = (await apiResponse.json()) as
        | OutfitBuilderResponse
        | { message?: string };

      if (!apiResponse.ok) {
        throw new Error(getApiErrorMessage(payload));
      }

      setResponse(payload as OutfitBuilderResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Outfit builder could not respond.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="section-border rounded-[36px] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge>AI Outfit Builder</Badge>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-obsidian">
            Build the look from live catalogue signals.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-obsidian/70">
          Outfit options use only in-stock structured SKXNZ products and clearly show
          total price before you browse deeper.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Budget
            </span>
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className={fieldClassName}
              inputMode="numeric"
              placeholder="10000"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Occasion
            </span>
            <input
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
              className={fieldClassName}
              placeholder="night event"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Style
            </span>
            <input
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className={fieldClassName}
              placeholder="streetwear"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Size
            </span>
            <input
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className={fieldClassName}
              placeholder="L"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Gender
            </span>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className={fieldClassName}
            >
              {["Unisex", "Men", "Woman"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Color signal
            </span>
            <input
              value={colorPreference}
              onChange={(event) => setColorPreference(event.target.value)}
              className={fieldClassName}
              placeholder="Black"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
            Prompt
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={fieldClassName}
            placeholder="limited edition look"
          />
        </label>

        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? "Building looks..." : "Build Outfit Options"}
        </Button>
      </form>

      {errorMessage ? (
        <div className="mt-5 rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm text-sangria break-words">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 rounded-[28px] border border-sandstone/80 bg-white/80 p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
          Outfit Output
        </p>
        <p className="mt-3 text-sm leading-7 text-obsidian/80">
          {response?.summary ??
            "Build 2–3 outfit options from structured SKXNZ data. The builder respects price, stock, size, and styling rules."}
        </p>

        {response?.options?.length ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {response.options.map((option) => (
              <div
                key={option.id}
                className="rounded-[24px] border border-sandstone/80 bg-pearlcream/90 p-4"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  {option.withinBudget ? "Within Budget" : "Over Budget"}
                </p>
                <h3 className="mt-2 font-display text-lg uppercase tracking-[0.1em] text-obsidian">
                  {option.title}
                </h3>
                <p className="mt-2 text-sm text-sangria">
                  Total ₹{option.totalPrice.toLocaleString("en-IN")}
                </p>
                <p className="mt-3 text-sm leading-6 text-obsidian/70">
                  {option.explanation}
                </p>
                <div className="mt-4 space-y-3">
                  {option.items.map((item) => (
                    <div
                      key={`${option.id}-${item.id}`}
                      className="rounded-[18px] border border-sandstone bg-white/80 p-3"
                    >
                      <p className="text-[0.62rem] uppercase tracking-[0.22em] text-teal">
                        {item.slot}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-obsidian">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-obsidian/60">
                        {item.brandName} · ₹{item.price.toLocaleString("en-IN")}
                      </p>
                      <Link
                        href={`/product/${item.slug}`}
                        className="mt-3 inline-flex rounded-full border border-sandstone bg-pearlcream px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-sangria transition hover:border-teal/45 hover:text-obsidian"
                      >
                        View Product
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-sandstone bg-pearlcream/65 p-5 text-sm leading-6 text-obsidian/70">
            No outfit options yet. Try:
            <br />
            streetwear under ₹5,000
            <br />
            full outfit under ₹10,000
            <br />
            perfume recommendation
          </div>
        )}
      </div>

      <AIDisclaimer className="mt-6" />
    </Card>
  );
}
