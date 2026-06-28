"use client";

import type { ChangeEvent, FormEvent } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  emptyDemoAddressInput,
  type DemoAddressInput,
} from "@/lib/data/addresses";
import { cn } from "@/lib/cn";

type AddressFormProps = {
  value: DemoAddressInput;
  submitLabel: string;
  onChange: (value: DemoAddressInput) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const textFields: {
  name: keyof Omit<DemoAddressInput, "isDefault">;
  label: string;
  className?: string;
}[] = [
  { name: "label", label: "Label" },
  { name: "fullName", label: "Full name" },
  { name: "phoneNumber", label: "Phone" },
  { name: "line1", label: "Address line 1", className: "sm:col-span-2" },
  { name: "line2", label: "Address line 2", className: "sm:col-span-2" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "postalCode", label: "Pincode" },
  { name: "country", label: "Country" },
];

export function AddressForm({
  value,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value: fieldValue } = event.target;

    onChange({
      ...value,
      [name]: fieldValue,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      {textFields.map((field) => (
        <label key={field.name} className={cn("block min-w-0", field.className)}>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            {field.label}
          </span>
          <input
            name={field.name}
            value={value[field.name] ?? emptyDemoAddressInput[field.name] ?? ""}
            onChange={handleTextChange}
            className="mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]"
          />
        </label>
      ))}

      <label className="flex min-w-0 items-start gap-3 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 sm:col-span-2">
        <input
          type="checkbox"
          checked={value.isDefault}
          onChange={(event) =>
            onChange({ ...value, isDefault: event.target.checked })
          }
          className="mt-1 h-4 w-4 accent-[var(--skxnz-maroon)]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-black uppercase tracking-[0.14em] text-midnightbrown">
            Make default address
          </span>
          <span className="mt-1 block text-sm leading-6 text-stone">
            Default is local/demo only. Account sync coming later.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
