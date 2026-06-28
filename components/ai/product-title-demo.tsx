"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { AIDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generateProductTitles,
  type ProductTitleInput,
} from "@/lib/ai-placeholders";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const defaultInput: ProductTitleInput = {
  productType: "Jacket",
  color: "Liquid Silver",
  fabric: "Technical nylon",
  style: "Technical minimal",
  targetBuyer: "Night-out creative",
};

export function ProductTitleDemo() {
  const [form, setForm] = useState(defaultInput);
  const [titles, setTitles] = useState(() => generateProductTitles(defaultInput));

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTitles(generateProductTitles(form));
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
                  "Cargo",
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
                placeholder="Technical nylon"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Style
              </span>
              <select
                name="style"
                value={form.style}
                onChange={handleChange}
                className={fieldClassName}
              >
                {[
                  "Technical minimal",
                  "Sculpted utility",
                  "After-dark futurist",
                  "Clean street luxury",
                  "Chrome statement",
                ].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Target buyer
            </span>
            <select
              name="targetBuyer"
              value={form.targetBuyer}
              onChange={handleChange}
              className={fieldClassName}
            >
              {[
                "Night-out creative",
                "Campus tastemaker",
                "Early adopter collector",
                "Studio operator",
                "Premium streetwear buyer",
              ].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <Button type="submit" size="lg">
            Generate 5 Title Options
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="section-border rounded-[36px] p-6 sm:p-8">
          <Badge>Output</Badge>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {titles.map((title, index) => (
              <div
                key={title}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  Option {index + 1}
                </p>
                <p className="mt-3 font-display text-xl uppercase tracking-[0.14em] text-pearl">
                  {title}
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
