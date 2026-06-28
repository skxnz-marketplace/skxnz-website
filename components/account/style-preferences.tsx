"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { getDemoUserProfile, type DemoBuyerProfileSettings } from "@/lib/data/user";

export function StylePreferences() {
  const [profile, setProfile] = useState<DemoBuyerProfileSettings | null>(null);

  useEffect(() => {
    setProfile(getDemoUserProfile());
  }, []);

  const preferenceRows = [
    ["Preferred category", profile?.preferredCategory ?? "Streetwear"],
    ["Favourite brands", profile?.favouriteBrands ?? "SKXNZ"],
    ["Favourite colors", profile?.favouriteColors ?? "Black, Chrome, Pearl"],
    ["Style vibe", profile?.styleVibe ?? "Futurewear"],
    ["Budget range", profile?.budgetRange ?? "Demo range"],
    ["Size preferences", profile?.sizePreferences ?? "Demo sizing"],
  ];

  return (
    <Card className="section-border rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Style preferences
      </p>
      <div className="mt-5 space-y-3">
        {preferenceRows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[22px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4"
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
              {label}
            </p>
            <p className="mt-2 break-words text-sm font-semibold leading-6 text-midnightbrown">
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-[22px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
        AI styling preferences are demo fields only. Persistent personalization
        sync is coming later.
      </p>
    </Card>
  );
}
