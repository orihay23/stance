import { defineConfig } from "vitepress";

// GitHub Pages serves this project site at /stance/ (the repo name), with
// the Histoire story build living alongside it under /stance/components/ —
// see .github/workflows/deploy.yml. Locally, both stay at the site root.
const isCI = Boolean(process.env.GITHUB_ACTIONS);
const base = isCI ? "/stance/" : "/";

// Used directly in hand-authored markdown/Vue content (e.g. components.md's
// story links) as a plain <a href> — never touched by VitePress's own
// link handling, so a root-relative path is fine and correct here.
const componentsUrl = isCI ? "/stance/components/" : "http://localhost:6006/";

// Used only for the themeConfig nav link below: VitePress auto-prepends
// `base` to any nav/sidebar `link` starting with "/", which would double it
// into "/stance/stance/components/". A fully-qualified URL (has a scheme)
// is recognized as external and left untouched, dodging that.
const navComponentsUrl = isCI ? "https://orihay23.github.io/stance/components/" : componentsUrl;

export default defineConfig({
  title: "stance",
  description: "An opinionated, accessible, themeable Vue 3 component library.",
  base,
  head: [
    ["link", { rel: "icon", type: "image/png", href: `${base}logo-icon.png` }],
    [
      // Sets data-theme-palette/data-theme-density before first paint, the
      // same anti-FOUC technique VitePress itself uses for its own
      // dark-mode class (which this doesn't touch at all — VitePress's own
      // built-in appearance toggle already applies .dark to <html> before
      // hydration, and that's the same orthogonal mode toggle stance's CSS
      // already expects; nothing to duplicate here). Plain vanilla JS by
      // necessity: this runs before Vue exists, so no composables/
      // localStorage-reading composable can be reused — see
      // ThemePicker.vue for the reactive, post-hydration counterpart that
      // reads these same two keys back out of the DOM once mounted.
      "script",
      {},
      `(function(){
        var root = document.documentElement;
        var palette = localStorage.getItem("stance-docs-palette") || "neutral";
        var density = localStorage.getItem("stance-docs-density") || "regular";
        root.setAttribute("data-theme-palette", palette);
        root.setAttribute("data-theme-density", density);
      })();`,
    ],
  ],
  // Left off deliberately: extension-less URLs need the host to serve
  // page.html for a request to /page, and plain (non-Jekyll) GitHub Pages
  // doesn't reliably do that without extra rewrite config. Keeping the
  // .html suffix on every generated link guarantees hard navigations
  // (bookmarks, shared links, the very first page load) work everywhere.
  cleanUrls: false,
  vite: {
    // Single source of truth for the Histoire base URL, so individual
    // pages (e.g. components.md) don't each re-derive it via a runtime
    // hostname check that could drift from this file.
    define: {
      __COMPONENTS_BASE__: JSON.stringify(componentsUrl),
    },
  },
  themeConfig: {
    logo: { src: "/logo-icon.png", alt: "stance logo" },
    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "Theming", link: "/theming" },
      { text: "Accessibility", link: "/accessibility" },
      { text: "Components", link: "/components" },
      { text: "Live Components ↗", link: navComponentsUrl, target: "_self" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Theming Guide", link: "/theming" },
          { text: "Accessibility", link: "/accessibility" },
          { text: "Components", link: "/components" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/orihay23/stance" }],
    search: {
      provider: "local",
    },
  },
});
