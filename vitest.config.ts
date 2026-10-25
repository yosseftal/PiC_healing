import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.web-locks.setup.ts"],
    passWithNoTests: false,
    include: [
      "packages/*/src/**/*.{test,spec}.{ts,tsx}",
      "packages/*/test/**/*.{test,spec}.{ts,tsx}",
    ],
  },
});
