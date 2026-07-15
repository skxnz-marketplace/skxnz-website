import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const wasmDir = "./node_modules/@next/swc-wasm-nodejs";
const useWindowsWasmFallback = process.platform === "win32" && existsSync(wasmDir);

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
