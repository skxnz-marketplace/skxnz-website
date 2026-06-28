"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { useDemoRole } from "@/components/auth/demo-role-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BuyerAssistantResponse } from "@/src/lib/ai/types";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const defaultResponse: BuyerAssistantResponse = {
  mode: "local-sheet-data",
  answer:
    "Ask about category, budget, size, or styling signal and the assistant will answer only from structured SKXNZ catalogue data.",
  suggestions: [],
  appliedSignals: [],
  disclaimer:
    "AI guidance uses structured SKXNZ catalogue data only. It does not guarantee fit, visual accuracy, delivery timing, or brand partnership status unless explicitly verified.",
};

function getApiErrorMessage(payload: BuyerAssistantResponse | { message?: string }) {
  return "message" in payload && payload.message
    ? payload.message
    : "Buyer AI assistant could not respond.";
}

export function BuyerAiAssistantPanel() {
  const { role } = useDemoRole();
  const [question, setQuestion] = useState("streetwear under ₹5,000");
  const [budget, setBudget] = useState("5000");
  const [category, setCategory] = useState("Streetwear");
  const [stylePreference, setStylePreference] = useState("oversized black look");
  const [size, setSize] = useState("L");
  const [response, setResponse] = useState<BuyerAssistantResponse>(defaultResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const apiResponse = await fetch("/api/ai/buyer-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-skxnz-demo-role": role ?? "buyer",
        },
        body: JSON.stringify({
          question,
          budget: budget ? Number(budget) : null,
          category,
          stylePreference,
          size,
        }),
      });

      const payload = (await apiResponse.json()) as
        | BuyerAssistantResponse
        | { message?: string };

      if (!apiResponse.ok) {
        throw new Error(getApiErrorMessage(payload));
      }

      setResponse(payload as BuyerAssistantResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Buyer AI assistant could not respond.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="section-border rounded-[36px] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge>Buyer AI Assistant</Badge>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-obsidian">
            Ask the catalogue.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-obsidian/70">
          This assistant answers from structured SKXNZ products, brands, categories,
          collections, and search keywords only.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
            Shopping question
          </span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className={fieldClassName}
            placeholder="black oversized look under ₹5,000"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Budget
            </span>
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className={fieldClassName}
              inputMode="numeric"
              placeholder="5000"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Category
            </span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={fieldClassName}
              placeholder="Streetwear"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-sangria/75">
              Style signal
            </span>
            <input
              value={stylePreference}
              onChange={(event) => setStylePreference(event.target.value)}
              className={fieldClassName}
              placeholder="limited edition"
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
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Checking signal..." : "Ask Buyer AI"}
          </Button>
        </div>
      </form>

      {errorMessage ? (
        <div className="mt-5 rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm text-sangria break-words">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 rounded-[28px] border border-sandstone/80 bg-white/80 p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
          AI Response
        </p>
        <p className="mt-3 text-sm leading-7 text-obsidian/80">{response.answer}</p>

        {response.appliedSignals.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {response.appliedSignals.map((signal) => (
              <Badge key={signal}>{signal}</Badge>
            ))}
          </div>
        ) : null}

        {response.suggestions.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {response.suggestions.map((product) => (
              <div
                key={product.id}
                className="rounded-[24px] border border-sandstone/80 bg-pearlcream/90 p-4"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  {product.brandName} · {product.category}
                </p>
                <h3 className="mt-2 line-clamp-2 font-display text-lg uppercase tracking-[0.1em] text-obsidian">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-sangria">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
                <p className="mt-3 text-sm leading-6 text-obsidian/70">
                  {product.whyItMatches}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-obsidian/55">
                  Sizes: {product.availableSizes.join(", ")} · {product.stockStatus}
                </p>
                <Link
                  href={`/product/${product.slug}`}
                  className="mt-4 inline-flex rounded-full border border-sandstone bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-sangria transition hover:border-teal/45 hover:text-obsidian"
                >
                  View Product
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-sandstone bg-pearlcream/65 p-5 text-sm leading-6 text-obsidian/70">
            No signal found.
            <br />
            Try another brand, category, or product.
          </div>
        )}
      </div>

      <AIDisclaimer className="mt-6" />
    </Card>
  );
}
