"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { DemoRole } from "@/lib/demo-role"

const storageKey = "skxnz-demo-role"

// Context shape is backward-compatible with DemoRoleProvider.
// All existing useDemoRole() consumers continue to work unchanged.
export type AuthContextValue = {
  user: User | null
  role: DemoRole | null
  isHydrated: boolean
  setRole: (role: DemoRole) => void
  clearRole: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isDemoRole(value: unknown): value is DemoRole {
  return value === "buyer" || value === "seller" || value === "admin"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbRole, setDbRole] = useState<DemoRole | null>(null)
  const [overrideRole, setOverrideRole] = useState<DemoRole | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Load demo-role override from localStorage (guest mode only)
    const stored = window.localStorage.getItem(storageKey)
    if (isDemoRole(stored)) setOverrideRole(stored)

    async function init() {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser()

      setUser(initialUser)

      if (initialUser) {
        await fetchDbRole(supabase, initialUser.id)
      } else {
        setIsHydrated(true)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        fetchDbRole(supabase, nextUser.id)
      } else {
        setDbRole(null)
        setIsHydrated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchDbRole(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    userId: string,
  ) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single()

    // DB stores BUYER/SELLER/RIDER/ADMIN — downcase to match DemoRole type
    const raw = (data?.role as string | undefined)?.toLowerCase()
    if (isDemoRole(raw)) setDbRole(raw)

    setIsHydrated(true)
  }

  // Authenticated users always get the DB role.
  // Guests get the localStorage override (demo mode).
  const role = user ? dbRole : overrideRole

  function setRole(nextRole: DemoRole) {
    if (user) return // DB is authoritative when signed in
    setOverrideRole(nextRole)
    window.localStorage.setItem(storageKey, nextRole)
  }

  function clearRole() {
    setOverrideRole(null)
    window.localStorage.removeItem(storageKey)
  }

  return (
    <AuthContext.Provider value={{ user, role, isHydrated, setRole, clearRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider.")
  return context
}

// Backward-compat alias — all existing useDemoRole() imports continue to work
export const useDemoRole = useAuth
