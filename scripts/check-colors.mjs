import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const allowedExtensions = new Set([".tsx", ".ts", ".jsx", ".js", ".css", ".scss"]);

const ignoredNames = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
]);

const ignoredPathFragments = [
  `${path.sep}public${path.sep}assets${path.sep}`,
  `${path.sep}public${path.sep}fonts${path.sep}`,
];

const wordIgnoredPathFragments = [`${path.sep}src${path.sep}data${path.sep}`];

const ignoredFiles = new Set(["package-lock.json"]);

const forbiddenHexes = [
  "#0A0D14",
  "#0F1626",
  "#00E5FF",
  "#6B00FF",
  "#FF007A",
  "#C0C6CC",
  "#F5F7FA",
];

const forbiddenWords = [
  "pink",
  "blue",
  "cyan",
  "purple",
  "magenta",
  "violet",
  "indigo",
  "neon",
];

const forbiddenTailwindColors = [
  "cyan",
  "purple",
  "pink",
  "blue",
  "indigo",
  "fuchsia",
];

const forbiddenTailwindUtilities = [
  "bg",
  "text",
  "border",
  "from",
  "to",
  "via",
];

const forbiddenPatterns = [
  ...forbiddenHexes.map((value) => ({
    type: "hex",
    regex: new RegExp(escapeRegExp(value), "gi"),
  })),
  {
    type: "word",
    regex: new RegExp(`\\b(?:${forbiddenWords.join("|")})\\b`, "gi"),
  },
  {
    type: "tailwind",
    regex: new RegExp(
      `(?:^|[^A-Za-z0-9-])(?:[a-z-]+:)*(?:${forbiddenTailwindUtilities.join("|")})-(?:${forbiddenTailwindColors.join("|")})(?:\\/[0-9.\\[\\]]+)?\\b`,
      "gi",
    ),
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldIgnoreDir(dirName) {
  return ignoredNames.has(dirName) || dirName.startsWith(".next");
}

function shouldIgnoreFile(filePath) {
  const normalized = path.normalize(filePath);
  const baseName = path.basename(normalized);

  if (ignoredFiles.has(baseName)) {
    return true;
  }

  return ignoredPathFragments.some((fragment) => normalized.includes(fragment));
}

function walk(currentDir, files = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name) && !shouldIgnoreFile(absolutePath)) {
        walk(absolutePath, files);
      }
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    if (shouldIgnoreFile(absolutePath)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function collectViolations(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const results = [];
  const normalizedPath = path.normalize(filePath);
  const ignoreWordChecks = wordIgnoredPathFragments.some((fragment) =>
    normalizedPath.includes(fragment),
  );

  lines.forEach((line, index) => {
    const matches = [];

    for (const pattern of forbiddenPatterns) {
      if (ignoreWordChecks && pattern.type === "word") {
        continue;
      }
      const regex = new RegExp(pattern.regex);
      let match;

      while ((match = regex.exec(line)) !== null) {
        const value = match[0].trim();
        if (!value) continue;
        matches.push(value);
      }
    }

    if (matches.length > 0) {
      results.push({
        lineNumber: index + 1,
        matches: [...new Set(matches)],
      });
    }
  });

  return results;
}

const sourceFiles = walk(rootDir);
const allViolations = [];

for (const filePath of sourceFiles) {
  const violations = collectViolations(filePath);
  if (violations.length === 0) continue;

  const relativePath = path.relative(rootDir, filePath);
  allViolations.push({ relativePath, violations });
}

if (allViolations.length > 0) {
  console.error("Forbidden color usage found:\n");

  for (const file of allViolations) {
    for (const violation of file.violations) {
      console.error(
        `${file.relativePath}:${violation.lineNumber} -> ${violation.matches.join(", ")}`,
      );
    }
  }

  process.exit(1);
}

console.log("No forbidden color usage found.");
