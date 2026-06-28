"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { communityReportReasons } from "@/lib/data/community";
import type {
  CommunityPost,
  CommunityReportReason,
} from "@/lib/types/community";

type ReportPostModalProps = {
  post: CommunityPost | null;
  onClose: () => void;
  onSubmit: (input: {
    postId: string;
    reason: CommunityReportReason;
    note: string;
  }) => void;
};

export function ReportPostModal({
  post,
  onClose,
  onSubmit,
}: ReportPostModalProps) {
  const [reason, setReason] = useState<CommunityReportReason>("Spam");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!post) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [post, onClose]);

  if (!post) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-signal-post-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl rounded-[32px] border border-[rgba(255,254,250,0.14)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-5 text-[var(--skxnz-text-light)] shadow-[0_30px_90px_rgba(16,0,6,0.38)] sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-glint)]">
              Report demo post
            </p>
            <h2
              id="report-signal-post-title"
              className="mt-2 font-display text-3xl uppercase tracking-[0.08em]"
            >
              Safety signal
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Reports are stored locally for MVP testing. Admin review is not live yet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white"
            aria-label="Close report modal"
          >
            X
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Reason
            </span>
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as CommunityReportReason)
              }
              className="rounded-[18px] border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none"
            >
              {communityReportReasons.map((entry) => (
                <option key={entry} className="text-black">
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-white/62">
              Optional note
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={180}
              rows={4}
              placeholder="Add context for the future moderation queue..."
              className="min-h-28 rounded-[20px] border border-white/12 bg-white/[0.08] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/38 focus:border-[rgba(34,211,238,0.45)]"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSubmit({ postId: post.id, reason, note });
                setReason("Spam");
                setNote("");
              }}
            >
              Submit Report Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
