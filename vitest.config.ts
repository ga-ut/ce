import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@ga-ut/ce/web": new URL(
        "./packages/ce/src/web/index.ts",
        import.meta.url
      ).pathname,
    },
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.spec.ts", "tests/**/*.test.ts"],
  },
});
