"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

// Reusable Cloudflare Turnstile widget.
//
// It loads the Turnstile script only while mounted, so the ~40 KB script is
// fetched exclusively on the auth routes that render this component — never
// globally. Rendering is explicit (not auto) so multiple widgets never collide
// and we control the exact container.
//
// The token is handed to the parent via onToken and is NEVER persisted, logged,
// or written to storage. On expiry/error the parent's token is cleared so a
// stale challenge can't be submitted.

type TurnstileTheme = "auto" | "light" | "dark";

type Props = {
  siteKey: string;
  /** Called with the token on success, and with null on expiry/error/reset. */
  onToken: (token: string | null) => void;
  /** Optional action label, echoed by Siteverify for server-side matching. */
  action?: string;
  theme?: TurnstileTheme;
  /** Shown when the keys are Cloudflare dummies — cosmetic protection only. */
  testMode?: boolean;
  className?: string;
};

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __skxnzTurnstileLoading?: Promise<void>;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__skxnzTurnstileLoading) return window.__skxnzTurnstileLoading;

  window.__skxnzTurnstileLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile-script")), { once: true });
      if (window.turnstile) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile-script"));
    document.head.appendChild(s);
  });
  return window.__skxnzTurnstileLoading;
}

export function TurnstileWidget({
  siteKey,
  onToken,
  action,
  theme = "auto",
  testMode = false,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const statusId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Keep the latest onToken without re-rendering the widget on each parent render.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const renderWidget = useCallback(() => {
    const api = window.turnstile;
    const el = containerRef.current;
    if (!api || !el) return;
    // Clear any prior instance before re-rendering (StrictMode / remount).
    el.innerHTML = "";
    widgetIdRef.current = api.render(el, {
      sitekey: siteKey,
      action,
      theme,
      retry: "auto",
      "refresh-expired": "auto",
      callback: (token: string) => {
        setStatus("ready");
        onTokenRef.current(token);
      },
      "expired-callback": () => onTokenRef.current(null),
      "timeout-callback": () => onTokenRef.current(null),
      "error-callback": () => {
        setStatus("error");
        onTokenRef.current(null);
      },
    });
  }, [siteKey, action, theme]);

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        setStatus("ready");
        renderWidget();
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      const api = window.turnstile;
      if (api && widgetIdRef.current) {
        try {
          api.remove(widgetIdRef.current);
        } catch {
          /* already gone */
        }
      }
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  const retry = () => {
    setStatus("loading");
    onTokenRef.current(null);
    const api = window.turnstile;
    if (api && widgetIdRef.current) {
      try {
        api.reset(widgetIdRef.current);
        setStatus("ready");
        return;
      } catch {
        /* fall through to full re-render */
      }
    }
    renderWidget();
  };

  return (
    <div className={className}>
      <div ref={containerRef} aria-hidden={status !== "ready"} />

      {/* Screen-reader + visual status. aria-live so verification state is announced. */}
      <p id={statusId} aria-live="polite" className="mt-2 text-[0.7rem] leading-5 text-white/55">
        {status === "loading" && "Loading human-verification check…"}
        {status === "ready" && "Complete the human-verification check above to continue."}
        {status === "error" && (
          <span className="text-[#ff8fb0]">
            Verification could not load.{" "}
            <button type="button" onClick={retry} className="underline underline-offset-2">
              Retry
            </button>
          </span>
        )}
      </p>

      {testMode && (
        <p className="mt-1 text-[0.66rem] leading-4 text-white/40">
          Test mode — verification is not enforcing real bot protection on this environment.
        </p>
      )}
    </div>
  );
}

export default TurnstileWidget;
