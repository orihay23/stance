import { HstVue } from "@histoire/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "histoire";

// Deployed alongside the VitePress docs site at /stance/components/ (see
// .github/workflows/deploy.yml and apps/docs/.vitepress/config.ts, which
// computes the matching link) — locally, story:dev/story:preview stay at
// the site root.
const base = process.env.GITHUB_ACTIONS ? "/stance/components/" : "/";

export default defineConfig({
  plugins: [HstVue()],
  setupFile: "/histoire.setup.ts",
  storyMatch: ["src/**/*.story.vue"],
  // GitHub Pages only honors a 404.html at the site root, not one nested in
  // a subdirectory — so a copy-of-index.html SPA-fallback placed under
  // /components/ (as this repo tried before) is silently ignored, and deep
  // links straight to a story 404 for real. Hash-based routing sidesteps
  // the problem entirely: the fragment after `#` is never sent to the
  // server, so the browser only ever requests /components/ itself (which
  // is a real file) and Histoire's own router resolves the story
  // client-side from location.hash after boot.
  routerMode: "hash",
  vite: {
    base,
    plugins: [vue(), tailwindcss()],
  },
});
