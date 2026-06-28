"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { DemoRole } from "@/lib/demo-role";

const storageKey = "skxnz-demo-role";

type DemoRoleContextValue = {
  role: DemoRole | null;
  isHydrated: boolean;
  setRole: (role: DemoRole) => void;
  clearRole: () => void;
};

const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

type DemoRoleProviderProps = {
  children: ReactNode;
};

function isDemoRole(value: string | null): value is DemoRole {
  return value === "buyer" || value === "seller" || value === "admin";
}

export function DemoRoleProvider({ children }: DemoRoleProviderProps) {
  const [role, setRoleState] = useState<DemoRole | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedRole = window.localStorage.getItem(storageKey);

    if (isDemoRole(storedRole)) {
      setRoleState(storedRole);
    }

    setIsHydrated(true);
  }, []);

  function setRole(nextRole: DemoRole) {
    setRoleState(nextRole);
    window.localStorage.setItem(storageKey, nextRole);
  }

  function clearRole() {
    setRoleState(null);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <DemoRoleContext.Provider value={{ role, isHydrated, setRole, clearRole }}>
      {children}
    </DemoRoleContext.Provider>
  );
}

export function useDemoRole() {
  const context = useContext(DemoRoleContext);

  if (!context) {
    throw new Error("useDemoRole must be used within DemoRoleProvider.");
  }

  return context;
}
