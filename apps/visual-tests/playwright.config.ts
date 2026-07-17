import { defineConfig, devices } from "@playwright/test";

const PORT = 6006;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",

  // Chromium only — this is visual regression for our own components'
  // rendering, not a cross-browser compatibility suite; Chromium is what's
  // already pre-installed in this environment and in CI.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: {
    baseURL,
    trace: "retain-on-failure",
  },

  expect: {
    // Modest tolerance for anti-aliasing/font-rendering noise across runs,
    // not for real visual drift — tightened later if this proves too loose.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },

  // Serves the *built* Histoire output — must already exist
  // (`pnpm --filter @stance/playground story:build`). Deliberately not
  // building here: keeps "build once" separate from "run tests many
  // times" while iterating locally, and CI runs the build as its own step.
  webServer: {
    command: "pnpm --filter @stance/playground story:preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    cwd: "../..",
    // Without these, a webServer startup failure surfaces only as a
    // generic "Timed out waiting Nms from config.webServer" — the actual
    // error from the underlying command is swallowed. Cost real
    // debugging time tracking down a base-path mismatch that looked like
    // a dependency resolution error from the timeout message alone; piped
    // to inherit so it lands in the same CI log instead of a separate file.
    stdout: "pipe",
    stderr: "pipe",
  },
});
