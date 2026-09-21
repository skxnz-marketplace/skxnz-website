"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminGrantCommunityPoster,
  adminRevokeCommunityPoster,
} from "@/lib/community/admin-community-actions";
import type { CommunityPosterGrant } from "@/lib/community/admin-read-community";

type CommunityPosterGrantsPanelProps = {
  grants: CommunityPosterGrant[];
};

export function CommunityPosterGrantsPanel({ grants }: CommunityPosterGrantsPanelProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const grant = () => {
    startTransition(async () => {
      const result = await adminGrantCommunityPoster(email);
      setMessage(result.ok ? `Posting rights granted to ${email}.` : result.message);
      if (result.ok) setEmail("");
    });
  };

  const revoke = (userId: string, label: string) => {
    startTransition(async () => {
      const result = await adminRevokeCommunityPoster(userId);
      setMessage(result.ok ? `Posting rights revoked for ${label}.` : result.message);
    });
  };

  return (
    <Card className="section-border rounded-[32px] p-6 sm:p-8">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        Invite-Only Posting
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
        Grant or revoke posting rights.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-silver">
        Anyone can browse and like the community feed. Only invited buyers can
        post — grant an account by email below.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="buyer@example.com"
          className="field-shell min-w-0 flex-1 rounded-[16px] px-4 py-3 text-sm"
        />
        <Button type="button" disabled={isPending || !email.trim()} onClick={grant}>
          Grant posting rights
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
          {message}
        </p>
      ) : null}

      <div className="mt-6 space-y-2">
        {grants.length === 0 ? (
          <p className="text-sm text-silver">No one has posting rights yet.</p>
        ) : (
          grants.map((grantRow) => (
            <div
              key={grantRow.userId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-pearl">
                  {grantRow.name || grantRow.email}
                </p>
                <p className="truncate text-xs text-silver">{grantRow.email}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => revoke(grantRow.userId, grantRow.name || grantRow.email)}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
