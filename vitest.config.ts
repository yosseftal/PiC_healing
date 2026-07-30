import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: [
      "packages/*/src/**/*.{test,spec}.ts",
      "packages/*/test/**/*.{test,spec}.ts",
    ],
  },
});
