const path = require("node:path");

module.exports = {
  plugins: {
    // Explicit path: Tailwind's own config lookup is relative to the process
    // cwd, and when it misses it silently falls back to the default config —
    // no theme and an empty content list, so every utility class disappears.
    tailwindcss: { config: path.join(__dirname, "tailwind.config.ts") },
    autoprefixer: {},
  },
};
