import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],

    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "components/**/*.{test,spec}.{ts,tsx}",
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],

      include: ["components/**/*.{ts,tsx}"],

      exclude: [
        "components/**/*.{test,spec}.{ts,tsx}",
      ],
    },
  },
});