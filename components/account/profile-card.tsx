"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  defaultDemoBuyerProfileSettings,
  getDemoUserProfile,
  updateDemoUserProfile,
  type DemoBuyerProfileSettings,
} from "@/lib/data/user";
import { cn } from "@/lib/cn";

const textFields: Array<{
  name: keyof Pick<
    DemoBuyerProfileSettings,
    | "name"
    | "email"
    | "phone"
    | "city"
    | "preferredCategory"
    | "favouriteBrands"
    | "favouriteColors"
    | "styleVibe"
    | "budgetRange"
    | "sizePreferences"
  >;
  label: string;
  type?: string;
}> = [
  { name: "name", label: "Name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "city", label: "City" },
  { name: "preferredCategory", label: "Preferred category" },
  { name: "favouriteBrands", label: "Favourite brands" },
  { name: "favouriteColors", label: "Favourite colors" },
  { name: "styleVibe", label: "Style vibe" },
  { name: "budgetRange", label: "Budget range" },
  { name: "sizePreferences", label: "Size preferences" },
];

export function ProfileCard() {
  const [profile, setProfile] =
    useState<DemoBuyerProfileSettings>(defaultDemoBuyerProfileSettings);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getDemoUserProfile());
  }, []);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateToggle(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProfile = updateDemoUserProfile(profile);
    setProfile(nextProfile);
    setFeedback("Demo profile saved locally. Persistent account sync coming later.");
  }

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Demo profile
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Buyer profile foundation
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone">
        These fields are saved locally for MVP testing only. Real authentication
        and persistent account sync are not connected yet.
      </p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
        {textFields.map((field) => {
          const fieldValue = profile[field.name];
          const isLongField =
            field.name === "styleVibe" || field.name === "sizePreferences";

          return (
            <label
              key={field.name}
              className={cn("block min-w-0", isLongField ? "sm:col-span-2" : "")}
            >
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
                {field.label}
              </span>
              {isLongField ? (
                <textarea
                  name={field.name}
                  value={String(fieldValue)}
                  rows={3}
                  onChange={updateField}
                  className="mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]"
                />
              ) : (
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  value={String(fieldValue)}
                  onChange={updateField}
                  className="mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]"
                />
              )}
            </label>
          );
        })}

        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <ToggleField
            name="interestedInDrops"
            checked={profile.interestedInDrops}
            label="Interested in drops"
            onChange={updateToggle}
          />
          <ToggleField
            name="interestedInAiStyling"
            checked={profile.interestedInAiStyling}
            label="Interested in AI styling"
            onChange={updateToggle}
          />
        </div>

        {feedback ? (
          <p className="rounded-[22px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown sm:col-span-2">
            {feedback}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className={buttonVariants({
              variant: "primary",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            Save Demo Profile
          </button>
        </div>
      </form>
    </Card>
  );
}

function ToggleField({
  name,
  checked,
  label,
  onChange,
}: {
  name: "interestedInDrops" | "interestedInAiStyling";
  checked: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-4 rounded-[24px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] p-4">
      <span className="break-words text-sm font-bold uppercase tracking-[0.14em] text-midnightbrown">
        {label}
      </span>
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-[var(--skxnz-maroon)]"
      />
    </label>
  );
}
