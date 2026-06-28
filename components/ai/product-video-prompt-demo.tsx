"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generateVideoPrompt,
  type ProductVideoPromptInput,
} from "@/lib/ai-placeholders";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const defaultInput: ProductVideoPromptInput = {
  productType: "Jacket",
  color: "Liquid Silver",
  mood: "Nocturnal and cinematic",
  background: "an obsidian studio with chrome reflections",
  modelStyle: "a sharp futurewear model with controlled movement",
};

export function ProductVideoPromptDemo() {
  const [form, setForm] = useState(defaultInput);
  const [prompt, setPrompt] = useState(() => generateVideoPrompt(defaultInput));

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
    setPrompt(generateVideoPrompt(form));
  };

  return (
    <div className="mt-10 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <Badge>Rule-Based Demo</Badge>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Product type
              </span>
              <select
                name="productType"
                value={form.productType}
                onChange={handleChange}
                className={fieldClassName}
              >
                {[
                  "Jacket",
                  "Hoodie",
                  "Tee",
                  "Vest",
                  "Cap",
                  "Backpack",
                  "Runners",
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Color
              </span>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Liquid Silver"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Mood
            </span>
            <input
              name="mood"
              value={form.mood}
              onChange={handleChange}
              className={fieldClassName}
              placeholder="Nocturnal and cinematic"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Background
            </span>
            <input
              name="background"
              value={form.background}
              onChange={handleChange}
              className={fieldClassName}
              placeholder="an obsidian studio with chrome reflections"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Model style
            </span>
            <input
              name="modelStyle"
              value={form.modelStyle}
              onChange={handleChange}
              className={fieldClassName}
              placeholder="a sharp futurewear model with controlled movement"
            />
          </label>

          <Button type="submit" size="lg">
            Generate 4-Second Prompt
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <Badge>Output</Badge>
          <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-7 text-silver">
            {prompt}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              "Open with material detail",
              "Transition to silhouette reveal",
              "End on a centered hero frame",
            ].map((step) => (
              <div
                key={step}
                className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver"
              >
                {step}
              </div>
            ))}
          </div>
        </Card>

        <AIDisclaimer />
      </div>
    </div>
  );
}
