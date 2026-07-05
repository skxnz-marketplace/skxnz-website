// SERVER ONLY — never import into a client component or any file with 'use client'.
//
// Single source of truth for the current user's role in server code.
// Role is read ONLY from public.users.role (the DB), never from localStorage,
// demo headers, or client-side claims. DB roles are uppercase.
//
// Use these in Server Components / route handlers / server actions. Middleware
// has its own inline check (Edge runtime) — keep the two in sync.
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

/** Uppercase DB roles. Matches the public.user_role enum in migration 0001. */
export type DbRole = "BUYER" | "SELLER" | "RIDER" | "ADMIN"

const DB_ROLES: readonly DbRole[] = ["BUYER", "SELLER", "RIDER", "ADMIN"]

function isDbRole(value: unknown): value is DbRole {
  return typeof value === "string" && (DB_ROLES as readonly string[]).includes(value)
}

/**
 * Current authenticated Supabase user, or null if logged out.
 * Uses getUser() (validated server-side), not the raw cookie session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/** Detailed role lookup result — distinguishes "no row" from "query error". */
export type RoleLookupResult = {
  role: DbRole | null
  /** true when a public.users row was returned for this auth user */
  rowFound: boolean
  /** Supabase error message when the query itself failed (RLS, network, etc.) */
  error: string | null
  /** Raw role value when the row exists but the value is not a known DbRole */
  rawRole: string | null
}

/**
 * Current user's role from public.users.role with full failure detail.
 * Uses maybeSingle so "no visible row" (missing row OR RLS-filtered) is
 * distinguishable from a hard query error. Never uses the service role.
 */
export async function getCurrentUserRoleDetail(): Promise<RoleLookupResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { role: null, rowFound: false, error: null, rawRole: null }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.warn("[auth] public.users role query failed:", error.message)
    return { role: null, rowFound: false, error: error.message, rawRole: null }
  }

  if (!data) {
    // No visible row: either the row does not exist in THIS project's DB, or
    // RLS "users: owner can select" is missing/broken in the live DB.
    return { role: null, rowFound: false, error: null, rawRole: null }
  }

  const raw = typeof data.role === "string" ? data.role : null
  return {
    role: isDbRole(data.role) ? data.role : null,
    rowFound: true,
    error: null,
    rawRole: raw,
  }
}

/**
 * Current user's uppercase DB role from public.users.role, or null if logged
 * out or the row/role is missing. RLS "owner can select" allows reading own row.
 */
export async function getCurrentUserRole(): Promise<DbRole | null> {
  const { role } = await getCurrentUserRoleDetail()
  return role
}

/**
 * Require a logged-in user. Redirects to /login (with a safe relative next
 * path) when logged out. Returns the user otherwise.
 */
export async function requireUser(nextPath = "/account"): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(safeRelative(nextPath))}`)
  return user
}

/**
 * Require the current user to hold one of allowedRoles (read from
 * public.users.role). Logged out -> /login; wrong role -> home page.
 * Returns the matched role.
 */
export async function requireRole(
  allowedRoles: DbRole[],
  nextPath = "/",
): Promise<DbRole> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(safeRelative(nextPath))}`)

  const role = await getCurrentUserRole()
  if (!role || !allowedRoles.includes(role)) redirect("/")
  return role
}

/** Lowercased role for frontend/app context only. Never used for authz. */
export function toAppRole(role: DbRole | null): string | null {
  return role ? role.toLowerCase() : null
}

/** Guarantee a value is a root-relative same-origin path, else "/". */
function safeRelative(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/"
  }
  return path
}
