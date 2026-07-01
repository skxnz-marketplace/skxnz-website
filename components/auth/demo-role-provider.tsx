// Backward-compat shim. All imports of DemoRoleProvider / useDemoRole from this
// file continue to work — they now resolve to the real AuthProvider.
export { AuthProvider as DemoRoleProvider, useDemoRole } from "@/components/auth/auth-provider"
