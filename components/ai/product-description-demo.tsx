"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generateProductDescription,
  type ProductDescriptionInput,
} from "@/lib/ai-placeholders";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const textareaClassName =
  "field-shell w-full min-w-0 max-w-full break-words rounded-[24px] px-4 py-3 text-sm";

const defaultInput: ProductDescriptionInput = {
  productName: "Neutra X Hoodie",
  category: "Outerwear",
  fabric: "420 GSM cotton blend",
  fit: "Relaxed",
  color: "Obsidian Black",
  styleNotes: "reflective seam mapping and a sharp layered silhouette",
};

export function ProductDescriptionDemo() {
  const [form, setForm] = useState(defaultInput);
  const [output, setOutput] = useState(() =>
    generateProductDescription(defaultInput),
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
    setOutput(generateProductDescription(form));
  };

  return (
    <div className="mt-10 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <Badge>Rule-Based Demo</Badge>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Product name
              </span>
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Neutra X Hoodie"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Category
              </span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={fieldClassName}
              >
                {[
                  "Outerwear",
                  "Jackets",
                  "Tops",
                  "Bottoms",
                  "Accessories",
                  "Bags",
                  "Footwear",
                  "Vests",
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Fabric
              </span>
              <input
                name="fabric"
                value={form.fabric}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="420 GSM cotton blend"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Fit
              </span>
              <select
                name="fit"
                value={form.fit}
                onChange={handleChange}
                className={fieldClassName}
              >
                {["Relaxed", "Tailored", "Oversized", "Boxy", "Slim"].map(
                  (option) => (
                    <option key={option}>{option}</option>
                  ),
                )}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Color
            </span>
            <input
              name="color"
              value={form.color}
              onChange={handleChange}
              className={fieldClassName}
              placeholder="Obsidian Black"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Style notes
            </span>
            <textarea
              name="styleNotes"
              value={form.styleNotes}
              onChange={handleChange}
              rows={4}
              className={textareaClassName}
              placeholder="reflective seam mapping and a sharp layered silhouette"
            />
          </label>

          <Button type="submit" size="lg">
            Generate Description
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <Badge>Output</Badge>
          <div className="mt-6 space-y-6">
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-7 text-silver">
              {output.shortDescription}
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                Bullet highlights
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-silver">
                {output.highlights.map((highlight) => (
                  <li key={highlight} className="signal-dot">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                Care note
              </p>
              <p className="mt-3 text-sm leading-7 text-silver">{output.careNote}</p>
            </div>
          </div>
        </Card>

        <AIDisclaimer />
      </div>
    </div>
  );
}
