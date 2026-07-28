import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const wasmDir = "./node_modules/@next/swc-wasm-nodejs";

// The WASM compiler is 5-20x slower than the native one and was only ever a
// fallback for when the platform binary failed to install. Use it strictly as
// that: a fallback, and only when the native binary genuinely is not loadable.
function hasNativeSwc() {
  try {
    createRequire(import.meta.url).resolve("@next/swc-win32-x64-msvc");
    return true;
  } catch {
    return false;
  }
}

const useWindowsWasmFallback =
  process.platform === "win32" && !hasNativeSwc() && existsSync(wasmDir);

if (useWindowsWasmFallback) {
  console.warn(
    "[build] native @next/swc not found — falling back to the WASM compiler (slow).",
  );
}

const result = spawnSync(process.execPath, [nextCli, "build"], {
  stdio: "inherit",
  env: useWindowsWasmFallback
    ? { ...process.env, NEXT_TEST_WASM: "1", NEXT_TEST_WASM_DIR: wasmDir }
    : process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
