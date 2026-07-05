"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

type AuthCardProps = {
  mode: "login" | "signup"
  /** Safe relative path to return to after successful login (from ?next=). */
  nextPath?: string
}

/** Guarantee a root-relative same-origin path, else "/". */
function safeRelative(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/"
  }
  return path
}

/** Map raw Supabase auth errors to clearer, honest copy. */
function friendlyAuthError(message: string): string {
  if (/email not confirmed/i.test(message)) {
    return "Email not confirmed yet. Open the confirmation link we sent you, then sign in."
  }
  if (/invalid login credentials/i.test(message)) {
    return "Email or password is incorrect — or this email has not finished signup/confirmation."
  }
  return message
}

export function AuthCard({ mode, nextPath }: AuthCardProps) {
  const isSignup = mode === "signup"
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    const supabase = createClient()

    try {
      if (isSignup) {
        // Land verified users on /account so the authenticated state is obvious.
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account")}`
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { name: name.trim() },
          },
        })
        if (error) {
          setError(error.message)
        } else {
          setSuccessMsg(
            "Check your inbox to confirm your SKXNZ account.",
          )
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setError(friendlyAuthError(error.message))
        } else {
          router.push(safeRelative(nextPath))
          router.refresh()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        {isSignup ? "JOIN SKXNZ" : "Sign in"}
      </p>
      <h2 className="mt-4 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        {isSignup ? "ENTER THE SIGNAL." : "Welcome back."}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${mode}-name`}
              className="text-[0.72rem] uppercase tracking-[0.18em] text-stone"
            >
              Name
            </label>
            <input
              id={`${mode}-name`}
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[14px] border border-[rgba(58,8,24,0.15)] bg-white/60 px-4 py-3 text-sm text-midnightbrown placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sangria/30"
              placeholder="Your name"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${mode}-email`}
            className="text-[0.72rem] uppercase tracking-[0.18em] text-stone"
          >
            Email
          </label>
          <input
            id={`${mode}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[14px] border border-[rgba(58,8,24,0.15)] bg-white/60 px-4 py-3 text-sm text-midnightbrown placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sangria/30"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${mode}-password`}
            className="text-[0.72rem] uppercase tracking-[0.18em] text-stone"
          >
            Password
          </label>
          <input
            id={`${mode}-password`}
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[14px] border border-[rgba(58,8,24,0.15)] bg-white/60 px-4 py-3 text-sm text-midnightbrown placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sangria/30"
            placeholder="Min. 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-[14px] border border-sangria/30 bg-sangria/10 px-4 py-3 text-sm text-sangria">
            {error}
          </p>
        )}

        {successMsg && (
          <p className="rounded-[14px] border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-midnightbrown">
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={buttonVariants({ variant: "primary", size: "lg" }) + " mt-2 w-full disabled:opacity-60"}
        >
          {loading ? "Please wait..." : isSignup ? "CREATE ACCOUNT" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-stone">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-sangria underline underline-offset-2">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account?{" "}
            <Link href="/signup" className="text-sangria underline underline-offset-2">
              Create one
            </Link>
          </>
        )}
      </p>
    </Card>
  )
}
