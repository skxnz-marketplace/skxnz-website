import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const sourceDir = path.join(process.cwd(), ".next", "server", "vendor-chunks");
const targetDir = path.join(
  process.cwd(),
  ".next",
  "server",
  "chunks",
  "vendor-chunks",
);

if (!existsSync(sourceDir)) {
  console.log("No .next/server/vendor-chunks directory found. Skipping chunk normalization.");
  process.exit(0);
}

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

for (const entry of readdirSync(sourceDir)) {
  const sourcePath = path.join(sourceDir, entry);
  const targetPath = path.join(targetDir, entry);

  if (statSync(sourcePath).isFile()) {
    cpSync(sourcePath, targetPath);
  }
}

console.log("Normalized Next vendor chunks into .next/server/chunks/vendor-chunks.");
