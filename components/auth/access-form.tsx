"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { turnstileSiteKey, isTurnstileTestMode, captchaOptions } from "@/lib/security/turnstile";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import {
  normalizeAuthError,
  ENUMERATION_SAFE_SIGNUP,
  ENUMERATION_SAFE_RESET,
} from "@/lib/auth/auth-errors";
import { safeNextPath } from "@/lib/auth/safe-redirect";

export type AccessMode = "login" | "signup" | "forgot" | "reset";

type Props = {
  mode: AccessMode;
  /** Untrusted ?next= — always run through safeNextPath before use. */
  nextPath?: string;
};

const PASSWORD_MIN = 8;

export function AccessForm({ mode, nextPath }: Props) {
  const router = useRouter();
  const submitting = useRef(false); // hard double-submit guard

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false); // optional, OFF by default
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0); // bump to force reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const siteKey = turnstileSiteKey();
  const testMode = isTurnstileTestMode();
  const needsCaptcha = mode !== "reset"; // reset happens inside a recovery session
  const needsConfirm = mode === "signup" || mode === "reset";

  function resetChallenge() {
    setToken(null);
    setTurnstileKey((k) => k + 1); // remount widget -> fresh challenge
  }

  function validate(): string | null {
    if (mode !== "reset" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return "Enter a valid email address.";
    }
    if (mode !== "forgot") {
      if (password.length < PASSWORD_MIN) {
        return `Password must be at least ${PASSWORD_MIN} characters.`;
      }
      if (needsConfirm && password !== confirm) {
        return "Passwords don't match.";
      }
    }
    if (mode === "signup" && !acceptTerms) {
      return "Please accept the Terms and Privacy Policy to continue.";
    }
    if (needsCaptcha && !token) {
      return "Complete the human-verification check first.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // double-submit
    setError(null);
    setNotice(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    submitting.current = true;
    setLoading(true);
    const supabase = createClient();
    // captchaToken is forwarded to Supabase, which performs the authoritative
    // Siteverify once Bot Protection is enabled in the dashboard. We never run
    // our own Siteverify on this token — that would double-spend it.
    const captcha = captchaOptions(token);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: captcha,
        });
        if (error) {
          setError(normalizeAuthError(error).message);
          resetChallenge();
        } else {
          router.push(safeNextPath(nextPath));
          router.refresh();
        }
      } else if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          safeNextPath(nextPath ?? "/account"),
        )}`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { marketing_opt_in: marketing },
            ...captcha,
          },
        });
        // Enumeration-safe: same message whether or not the email already
        // exists. Never claim the account is active — verification is required.
        if (error && normalizeAuthError(error).code === "rate_limited") {
          setError(normalizeAuthError(error).message);
          resetChallenge();
        } else {
          setDone(true);
          setNotice(ENUMERATION_SAFE_SIGNUP);
        }
      } else if (mode === "forgot") {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
          ...captcha,
        });
        // Always generic — never reveal whether the address is registered.
        setDone(true);
        setNotice(ENUMERATION_SAFE_RESET);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setError(normalizeAuthError(error).message);
        } else {
          setDone(true);
          setNotice("Password updated. You can sign in with your new password.");
        }
      }
    } catch (err) {
      setError(normalizeAuthError(err).message);
      if (needsCaptcha) resetChallenge();
    } finally {
      // Token is single-use: drop it after every attempt regardless of outcome.
      setToken(null);
      submitting.current = false;
      setLoading(false);
    }
  }

  // Terminal success states (signup verify / forgot sent / reset done).
  if (done && (mode === "signup" || mode === "forgot" || mode === "reset")) {
    return (
      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 text-white">
        <p aria-live="polite" className="text-sm leading-6 text-white/85">
          {notice}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[var(--skxnz-pearl)] px-6 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--skxnz-obsidian)] transition hover:bg-white"
        >
          {mode === "reset" ? "Go to sign in" : "Back to sign in"}
        </Link>
      </div>
    );
  }

  const title =
    mode === "login"
      ? "Sign in"
      : mode === "signup"
        ? "Create your account"
        : mode === "forgot"
          ? "Reset your password"
          : "Set a new password";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 text-white">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-[0.04em] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-[0.85rem] leading-6 text-white/55">
          {mode === "login" && "Access your SKXNZ account to continue in the marketplace."}
          {mode === "signup" && "One account to save pieces, follow labels, and check out when payments open."}
          {mode === "forgot" && "Enter your email and we'll send a secure reset link."}
          {mode === "reset" && "Choose a new password for your SKXNZ account."}
        </p>
      </div>

      {mode !== "reset" && (
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? "access-error" : undefined}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
      )}

      {mode !== "forgot" && (
        <Field label={mode === "reset" ? "New password" : "Password"} htmlFor="password">
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={PASSWORD_MIN}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "access-error" : "password-hint"}
              className={inputClass + " pr-16"}
              placeholder={`Min. ${PASSWORD_MIN} characters`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex min-h-[44px] items-center px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {mode !== "login" && (
            <p id="password-hint" className="mt-1 text-[0.72rem] text-white/45">
              Use at least {PASSWORD_MIN} characters. A longer passphrase is stronger.
            </p>
          )}
        </Field>
      )}

      {needsConfirm && (
        <Field label="Confirm password" htmlFor="confirm">
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            placeholder="Re-enter password"
          />
        </Field>
      )}

      {mode === "signup" && (
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 text-[0.8rem] leading-6 text-white/70">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--skxnz-ai-aqua)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-white">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {/* Optional + OFF by default. NOT bundled with the mandatory terms. */}
          <label className="flex items-start gap-3 text-[0.8rem] leading-6 text-white/55">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--skxnz-ai-aqua)]"
            />
            <span>Send me occasional drops and label news. Optional — you can opt out any time.</span>
          </label>
        </div>
      )}

      {needsCaptcha && (
        <TurnstileWidget
          key={turnstileKey}
          siteKey={siteKey}
          onToken={setToken}
          action={mode}
          theme="dark"
          testMode={testMode}
        />
      )}

      {error && (
        <p
          id="access-error"
          role="alert"
          className="rounded-xl border border-[#ff8fb0]/40 bg-[#ff8fb0]/10 px-4 py-3 text-[0.82rem] text-[#ffc2d4]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="min-h-[48px] rounded-full bg-[var(--skxnz-pearl)] px-6 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--skxnz-obsidian)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]"
      >
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Update password"}
      </button>

      <AccessFooterLinks mode={mode} />
    </form>
  );
}

function AccessFooterLinks({ mode }: { mode: AccessMode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8rem] text-white/55">
      {mode === "login" && (
        <>
          <Link href="/forgot-password" className="underline underline-offset-2 hover:text-white">
            Forgot password?
          </Link>
          <span>
            New here?{" "}
            <Link href="/signup" className="text-[var(--skxnz-ai-aqua)] underline underline-offset-2">
              Create an account
            </Link>
          </span>
        </>
      )}
      {mode === "signup" && (
        <span>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--skxnz-ai-aqua)] underline underline-offset-2">
            Sign in
          </Link>
        </span>
      )}
      {(mode === "forgot" || mode === "reset") && (
        <Link href="/login" className="underline underline-offset-2 hover:text-white">
          Back to sign in
        </Link>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[0.72rem] uppercase tracking-[0.16em] text-white/55">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 transition focus:border-[var(--skxnz-ai-aqua)]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--skxnz-ai-aqua)]/40";

export default AccessForm;
