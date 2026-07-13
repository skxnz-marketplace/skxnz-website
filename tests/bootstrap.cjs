// Test bootstrap: resolves the "@/..." path alias against the tsc build
// output (tests/.build) and swaps @/lib/supabase/server for the test double.
// No test framework dependency — plain node:test runs on top of this.
//
// The mock swap means these tests exercise the REAL server-action logic
// (validation, ownership checks, netting, insert payloads) against a fake
// Supabase client. They are application-layer tests; RLS itself is verified
// separately by supabase/verification/0005_commerce_layer_isolation.sql on
// the live database. No database integration result is faked here.

const Module = require("module");
const path = require("path");

const buildRoot = path.join(__dirname, ".build");
const supabaseMockPath = path.join(__dirname, "mocks", "supabase-server.cjs");
const supabaseAdminMockPath = path.join(__dirname, "mocks", "supabase-admin.cjs");
const nextStubsPath = path.join(__dirname, "mocks", "next-stubs.cjs");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "@/lib/supabase/server") {
    return originalResolve.call(this, supabaseMockPath, ...rest);
  }
  if (request === "@/lib/supabase/admin") {
    return originalResolve.call(this, supabaseAdminMockPath, ...rest);
  }
  if (request === "next/cache" || request === "next/navigation") {
    return originalResolve.call(this, nextStubsPath, ...rest);
  }
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(buildRoot, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};
