import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  test: {
    environment: "node",
    coverage: {
      exclude: [
        ".next/**",
        "coverage/**",
        "dist/**",
        "next-env.d.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "tailwind.config.ts",
        "eslint.config.mjs",
        "vitest.config.ts",
        "**/*types.ts",
        "components/status-tile.tsx"
      ]
    }
  }
});
