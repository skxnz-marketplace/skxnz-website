"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AccessForm } from "@/components/auth/access-form";

// Guards /reset-password. The reset link routes through /auth/callback, which
// exchanges the recovery code for a session. If that session exists, the user
// may set a new password. A direct visit, an expired link, or an invalid link
// leaves no recovery session — we show a clear invalid-link state instead of an
// unusable form, and never leak whether the email was valid.

type State = "checking" | "ready" | "invalid";

export function ResetGate() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // If the callback just set a recovery session, getUser resolves to a user.
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState(data?.user && !error ? "ready" : "invalid");
    });

    // Supabase may emit PASSWORD_RECOVERY slightly after mount on some flows.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session?.user) setState("ready");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "checking") {
    return (
      <p aria-live="polite" className="text-sm text-white/60">
        Checking your reset link…
      </p>
    );
  }

  if (state === "invalid") {
    return (
      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 text-white">
        <h1 className="font-display text-2xl uppercase tracking-[0.04em]">Link expired</h1>
        <p className="mt-2 text-[0.85rem] leading-6 text-white/60">
          This password-reset link is invalid or has expired. Request a fresh one
          and we&apos;ll email it to you.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[var(--skxnz-pearl)] px-6 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--skxnz-obsidian)] transition hover:bg-white"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <AccessForm mode="reset" />;
}

export default ResetGate;
