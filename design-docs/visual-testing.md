# Visual regression testing design doc

Status: implemented. Phase 7 of the project — see CLAUDE.md's component
priority order for context on what's shipped so far.

## 1. Tool choice: Playwright's `toHaveScreenshot`, not Lost Pixel

Lost Pixel was the tool originally specified for this phase. Before wiring
anything up, its current status was checked (per standing practice: verify a
tool's docs/status before building on it, since tooling changes). Its GitHub
repo is archived and the product — OSS CLI and hosted PR-approval UI alike —
is being sunset as part of an acquisition. Building a new dependency on a
tool mid-sunset was rejected in favor of Playwright's own native
`expect(locator).toHaveScreenshot()`:

- Actively maintained, and `@playwright/test` was already a dependency of
  this environment's tooling.
- Zero new external services — baselines are committed PNGs, diffed locally
  and in CI, with no hosted approval UI to depend on. "Approving" a new
  baseline is running `--update-snapshots` and committing the result, same
  as any other generated-file change.

## 2. Package placement: `apps/visual-tests`, not `packages/core`

A new `apps/*` package, matching the existing non-published-tooling
convention (`apps/playground`, `apps/docs`) rather than folding into
`packages/core`. Visual tests need their own Playwright config, browser
binaries, and a running Histoire server — none of that belongs in a
published library package's dependency tree.

## 3. Coverage mechanism: a registry, not hand-written per-combination tests

The naive approach — write a Playwright test per (component × theme × mode ×
variant) combination — doesn't scale and duplicates what Histoire stories
already encode. Instead:

- **`registry/components/*.ts`**: one file per component, each a plain data
  structure (`ComponentSpec`) describing which of that component's *existing*
  Histoire story variants to capture, and how (which selector, any
  interaction to perform first).
- **`tests/visual.spec.ts`**: a single generic test that iterates the whole
  registry and calls `toHaveScreenshot()` per capture. Adding a component
  means adding a registry file, not writing new test logic.
- **`registry/manifest.ts`**: resolves a variant's Playwright-navigable
  `variantId` from Histoire's own build manifest
  (`apps/playground/.histoire/dist/histoire.json`) by (component, variant
  title), rather than hardcoding numeric IDs that would silently break if a
  variant were reordered.

Themes × modes: the registry's `lightDarkCaptures()` helper captures the
existing `[data-theme]` (light) / `[data-theme].dark` (dark) sibling
sections every story already uses — reusing the one mechanism that already
exists rather than inventing a second theme-toggling path. Today that's a
1-theme × 2-mode matrix (only `neutral` exists yet); the mechanism scales
automatically to the 4-theme matrix CLAUDE.md describes once those themes
are actually built — not solved speculatively today.

Responsive components (DataTable, TreeTable, Breadcrumb, Grid) get an
additional narrow-container variant capture, reusing whatever "narrow
container" demo already exists in that component's story rather than adding
a second container width nobody asked for.

## 4. The overlay/teleport wrinkle

Dialog, Popover, DropdownMenu, Tooltip, and DatePicker's calendar (plus
`ToastRegion`) all `<Teleport>` their open content to a shared
`#stance-overlay-root` on `document.body` — outside the themed section's own
DOM subtree. An element-scoped screenshot of the themed section after
clicking "open" would never show the actual opened panel.

Fixed by giving `CaptureSpec` two selector concepts instead of one:
`selector` (what to screenshot) and `interactionSelector` (what to click/
hover, before capturing). For a teleported panel, `interactionSelector`
points at the correct themed section's trigger button (light vs. dark share
button text like "Open dialog", so the scope matters for *finding the right
button*, not for the screenshot itself), while `selector` is left unset
(full-page) since the panel itself renders outside that section.

DatePicker's calendar carries its own `data-theme` once open, so `[data-theme]`
matches two elements post-open (the field wrapper and the teleported
calendar) — a Playwright strict-mode violation if used naively as a capture
selector. Resolved the same way: full-page capture, `interactionSelector`
only for opening it.

## 5. Known, accepted gaps (not bugs)

- **Toast dark mode**: `ToastRegion` is mounted once, inside the story's
  light-only wrapper. Triggering a toast from the "dark" section's buttons
  still renders the toast in whatever theme the single shared region uses —
  there's no way to demonstrate a dark-mode toast without changing the
  story's own mount structure, which is out of scope for a visual-test
  registry entry. Documented inline in `registry/components/toast.ts`.
- **Grid has no dark-mode story section** — a pre-existing gap in
  `Grid.story.vue` itself, not something introduced or fixed here. Grid's
  registry entry is light-only until the story gains one.
- **DataTable's registry entry is a curated subset** of its 12 real story
  variants (skips redundant ones like server-mode pagination and
  narrow-specific duplicates of pagination/selection) — chosen to cover each
  materially distinct visual state once, not exhaustively.

## 6. CI integration

`.github/workflows/ci.yml` runs `visual-regression` as its own job, parallel
to (not gating on, and not gated by) the existing unit `test` job — both
must pass for a PR to be mergeable. The job builds `@stance/core`, builds the
Histoire stories, installs Playwright's Chromium build (the sandbox's
pre-installed browser doesn't exist on fresh GitHub-hosted runners), and runs
the suite against the committed baselines. On failure, the HTML report and
`test-results/` (containing actual/expected/diff PNGs) are uploaded as build
artifacts for review — there's no hosted PR-comment UI, so this is the
mechanism for inspecting *what* changed.

Baselines are committed as PNGs directly in
`apps/visual-tests/tests/visual.spec.ts-snapshots/`. Accepting an intentional
visual change means running `pnpm --filter @stance/visual-tests test:update`
locally and committing the updated PNGs like any other generated-file diff.
