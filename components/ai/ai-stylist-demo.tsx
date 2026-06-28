"use client";

import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generateStylistRecommendations,
  stylistCatalog,
  type StylistInput,
} from "@/lib/ai-placeholders";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const defaultInput: StylistInput = {
  gender: "Unisex",
  occasion: "Night-out launch event",
  colorPreference: "Obsidian Black",
  stylePreference: "Technical futuristic layering",
};

export function AIStylistDemo() {
  const [form, setForm] = useState(defaultInput);
  const [recommendations, setRecommendations] = useState(() =>
    generateStylistRecommendations(defaultInput),
  );

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecommendations(generateStylistRecommendations(form));
  };

  return (
    <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <Badge>Rule-Based Demo</Badge>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Gender
              </span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={fieldClassName}
              >
                {["Unisex", "Menswear-led", "Womenswear-led"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Occasion
              </span>
              <input
                name="occasion"
                value={form.occasion}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Night-out launch event"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Color preference
              </span>
              <input
                name="colorPreference"
                value={form.colorPreference}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Obsidian Black"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Style preference
              </span>
              <input
                name="stylePreference"
                value={form.stylePreference}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Technical futuristic layering"
              />
            </label>
          </div>

          <Button type="submit" size="lg">
            Generate 3 Outfit Ideas
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <Badge>Output</Badge>
          <div className="mt-6 space-y-4">
            {recommendations.map((recommendation, index) => (
              <div
                key={recommendation.title}
                className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  Look {index + 1}
                </p>
                <h2 className="mt-3 font-display text-xl uppercase tracking-[0.14em] text-pearl">
                  {recommendation.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-silver">
                  {recommendation.reason}
                </p>
                <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  Palette
                </p>
                <p className="mt-2 text-sm leading-6 text-silver">
                  {recommendation.palette}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendation.productIds.map((productId) => {
                    const product = stylistCatalog.find((item) => item.id === productId);

                    if (!product) {
                      return null;
                    }

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-pearl transition hover:border-teal/35"
                      >
                        {product.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="section-border rounded-[36px] p-6">
          <Badge>Seed Catalog Used</Badge>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stylistCatalog.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <p className="font-display text-sm uppercase tracking-[0.14em] text-pearl">
                  {product.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-silver">
                  {product.category} · {product.colors.join(" / ")}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <AIDisclaimer />
      </div>
    </div>
  );
}
