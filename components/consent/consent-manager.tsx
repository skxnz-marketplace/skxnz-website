"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  allOnCategories,
  defaultCategories,
  rejectOptionalCategories,
  type ConsentCategories,
  type ConsentCategory,
} from "@/lib/consent/consent";
import { useConsent } from "@/lib/consent/use-consent";

// Cookie banner + preference centre in one client island. Mounted once, near
// the end of <body>. It reads the first-party consent cookie; the banner shows
// only when there is no valid, current-version decision. Optional categories
// default OFF. No dark patterns — Accept and Reject share the same visual
// weight. Nothing here initializes any tracker (none are installed); it only
// records the choice for future gated scripts.

const OPTIONAL: { key: Exclude<ConsentCategory, "necessary">; title: string; body: string }[] = [
  {
    key: "preferences",
    title: "Preferences",
    body: "Remembers choices like recently viewed items and display settings so the store feels consistent between visits.",
  },
  {
    key: "analytics",
    title: "Analytics",
    body: "Would let us measure which pages and products are used, in aggregate, to improve the experience. No analytics tool is currently connected — this control is here for when one is.",
  },
  {
    key: "marketing",
    title: "Marketing",
    body: "Would support personalised campaigns and measuring their performance. No marketing or advertising tool is currently connected — this control is here for when one is.",
  },
];

export function ConsentManager() {
  const { record, ready, decided, save, withdraw } = useConsent();
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentCategories>(defaultCategories());

  // The banner is a fixed overlay rendered ONLY after the client has read the
  // cookie (`ready`). On the server it renders nothing — so the root layout
  // never has to read cookies() (which would force every page dynamic and undo
  // the homepage-static optimization), there is no hydration mismatch, and a
  // decided user never sees a flash. An undecided user sees it fade in a frame
  // after hydration; being fixed-position it causes no layout shift.
  const showBanner = ready && !decided;

  const openPanel = useCallback(() => {
    setDraft(record?.categories ?? defaultCategories());
    setPanelOpen(true);
  }, [record]);

  // Let a footer link (or anything) open the centre via a custom event.
  useEffect(() => {
    const onOpen = () => openPanel();
    window.addEventListener("skxnz:open-cookie-preferences", onOpen);
    return () => window.removeEventListener("skxnz:open-cookie-preferences", onOpen);
  }, [openPanel]);

  const acceptAll = () => {
    save(allOnCategories());
    setPanelOpen(false);
  };
  const rejectOptional = () => {
    save(rejectOptionalCategories());
    setPanelOpen(false);
  };
  const saveDraft = () => {
    save(draft);
    setPanelOpen(false);
  };

  return (
    <>
      {showBanner && !panelOpen && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectOptional={rejectOptional}
          onManage={openPanel}
        />
      )}
      {panelOpen && (
        <PreferenceCentre
          draft={draft}
          setDraft={setDraft}
          record={record}
          onAcceptAll={acceptAll}
          onRejectOptional={rejectOptional}
          onSave={saveDraft}
          onWithdraw={() => {
            withdraw();
            setPanelOpen(false);
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}

function CookieBanner({
  onAcceptAll,
  onRejectOptional,
  onManage,
}: {
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onManage: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-white/12 bg-[var(--skxnz-obsidian)]/95 p-5 text-[var(--skxnz-text-light)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold tracking-wide">Cookies &amp; your choices</p>
          <p className="mt-1 text-[0.82rem] leading-6 text-white/70">
            We use cookies that are strictly necessary to run SKXNZ. Optional
            categories are off until you turn them on.{" "}
            <button
              type="button"
              onClick={onManage}
              className="underline underline-offset-2 hover:text-[var(--skxnz-ai-aqua)]"
            >
              Manage preferences
            </button>{" "}
            or read our{" "}
            <Link href="/cookies" className="underline underline-offset-2 hover:text-[var(--skxnz-ai-aqua)]">
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        {/* Equal-weight choices — no dark pattern. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRejectOptional}
            className="min-h-[44px] rounded-full border border-white/25 px-5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="min-h-[44px] rounded-full bg-[var(--skxnz-pearl)] px-5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--skxnz-obsidian)] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferenceCentre({
  draft,
  setDraft,
  record,
  onAcceptAll,
  onRejectOptional,
  onSave,
  onWithdraw,
  onClose,
}: {
  draft: ConsentCategories;
  setDraft: (c: ConsentCategories) => void;
  record: ReturnType<typeof useConsent>["record"];
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onSave: () => void;
  onWithdraw: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const lastDecision = useMemo(() => {
    if (!record) return null;
    try {
      return new Date(record.timestamp).toLocaleString();
    } catch {
      return null;
    }
  }, [record]);

  // Focus trap + Escape + restore focus on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button, [href], input, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => !el.hasAttribute("disabled"))
        : [];
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const toggle = (key: Exclude<ConsentCategory, "necessary">) =>
    setDraft({ ...draft, [key]: !draft[key] });

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close cookie preferences"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-centre-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 bg-[var(--skxnz-obsidian)] p-6 text-[var(--skxnz-text-light)] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cookie-centre-title" className="text-lg font-semibold tracking-wide">
              Cookie preferences
            </h2>
            <p className="mt-1 text-[0.8rem] leading-6 text-white/60">
              Choose what SKXNZ may use. You can change this any time from the footer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] rounded-full border border-white/20 text-white/70 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Strictly necessary — locked on. */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Strictly necessary</p>
              <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--skxnz-ai-aqua)]">
                Always on
              </span>
            </div>
            <p className="mt-1 text-[0.78rem] leading-6 text-white/60">
              Sign-in sessions, cart, checkout and security. The site can&apos;t run
              without these, so they can&apos;t be switched off.
            </p>
          </div>

          {OPTIONAL.map((cat) => (
            <label
              key={cat.key}
              className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <span>
                <span className="block text-sm font-semibold">{cat.title}</span>
                <span className="mt-1 block text-[0.78rem] leading-6 text-white/60">{cat.body}</span>
              </span>
              <input
                type="checkbox"
                checked={draft[cat.key]}
                onChange={() => toggle(cat.key)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--skxnz-ai-aqua)]"
                aria-label={`${cat.title} cookies`}
              />
            </label>
          ))}
        </div>

        <p aria-live="polite" className="mt-4 text-[0.72rem] text-white/45">
          {record
            ? `Current choice saved${lastDecision ? ` on ${lastDecision}` : ""}.`
            : "No choice saved yet."}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRejectOptional}
            className="min-h-[44px] flex-1 rounded-full border border-white/25 px-4 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={onSave}
            className="min-h-[44px] flex-1 rounded-full border border-[var(--skxnz-ai-aqua)]/60 px-4 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--skxnz-ai-aqua)] transition hover:border-[var(--skxnz-ai-aqua)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            Save preferences
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="min-h-[44px] flex-1 rounded-full bg-[var(--skxnz-pearl)] px-4 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--skxnz-obsidian)] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
          >
            Accept all
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-white/50">
          <Link href="/cookies" className="underline underline-offset-2 hover:text-white">
            Cookie Policy
          </Link>
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          {record && (
            <button
              type="button"
              onClick={onWithdraw}
              className="underline underline-offset-2 hover:text-white"
            >
              Withdraw consent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsentManager;
