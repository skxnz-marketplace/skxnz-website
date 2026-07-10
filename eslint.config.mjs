import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      ".next_*/**",
      ".next_dev_corrupt_*/**",
      "node_modules/**",
      "next-env.d.ts",
      "prisma/seed.mjs",
      "screenshots/**",
      // Node CJS test harness (node:test) — not Next app source. Compiled +
      // run via `pnpm run test:commerce`; typechecked by tests/tsconfig.json.
      "tests/**",
    ],
  },
];

export default eslintConfig;
