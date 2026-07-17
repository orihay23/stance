/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "StanceThemes",
      fileName: "index",
      formats: ["es"],
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
