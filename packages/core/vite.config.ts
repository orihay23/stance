/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * Wraps the emitted stylesheet in a named CSS cascade layer instead of
 * shipping it unlayered. Per the cascade-layers spec, an unlayered rule
 * always beats a layered one regardless of specificity — so with this
 * package's CSS unlayered and Tailwind v4 compiling consumer utilities into
 * `@layer utilities`, a consumer's Tailwind override could never win
 * against a stance `:where()` default, no matter how low its specificity,
 * defeating the whole ":where() lets a single Tailwind class win" design
 * (design-docs/theme-axes.md's Phase 14 notes; apps/docs/theming.md
 * "Overriding a component's styling"). This is the library-side half of the
 * fix — the consumer-side half is declaring their own desired layer order
 * (`@layer theme, base, stance, components, utilities;`) before importing
 * Tailwind, so "stance" lands after Tailwind's own "base" (its preflight
 * reset shouldn't outrank a real stance default — this exact ordering
 * mistake broke Accordion's borders during development, see
 * design-docs/theme-axes.md's "Cascade-layers fix" section) but before
 * "utilities" (so a Tailwind utility class still wins).
 * Applied as a `generateBundle` hook (not a `postcss-` plugin) because it
 * needs to run once against the final concatenated CSS asset — every
 * component's own `<style>` block plus src/style.css are merged into one
 * file first (`cssCodeSplit: false`), so this can't run per-source-file.
 */
function wrapStylesheetInLayer(layerName: string): Plugin {
  return {
    name: "wrap-stylesheet-in-layer",
    // Vite's own internal CSS-emission plugin adds the stylesheet asset to
    // the bundle in its own `generateBundle` hook, which otherwise runs
    // after any normal user plugin regardless of array position — `order:
    // "post"` is what actually guarantees this hook sees the finished
    // asset rather than running before it exists.
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const asset of Object.values(bundle)) {
          if (asset.type === "asset" && asset.fileName.endsWith(".css") && typeof asset.source === "string") {
            asset.source = `@layer ${layerName} {\n${asset.source}\n}\n`;
          }
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), wrapStylesheetInLayer("stance")],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "StanceCore",
      fileName: "stance-core",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: { vue: "Vue" },
        assetFileNames: (info) =>
          info.name?.endsWith(".css") ? "style.css" : (info.name ?? "[name][extname]"),
      },
    },
    cssCodeSplit: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
