# Project: [stance] — Vue Component Library

## Mission
A PrimeVue-scoped alternative: opinionated, accessible, themeable Vue 3 component
library. Ships with 4 first-party color palettes × 4 first-party density profiles
(each with light/dark variants), independently selectable — see "Theme
architecture" below — but is built so consumers can override styling via
Tailwind without specificity fights.

## Non-negotiable constraints
- **Vue 3 + `<script setup>` + TypeScript** for every component.
- **No `!important` anywhere.** Base styles must have low, predictable specificity
  so a single Tailwind utility class on the consumer's side wins by default.
  Prefer `:where()` wrapping for structural/default styles to keep specificity at 0.
  Under Tailwind v4, `:where()` alone isn't sufficient on its own: Tailwind wraps
  its utilities in `@layer utilities`, and per the CSS cascade-layers spec an
  unlayered rule always beats a layered one regardless of specificity — so
  `@stance-dev/core`'s build wraps its own compiled CSS in `@layer stance`
  (`packages/core/vite.config.ts`'s `wrapStylesheetInLayer` plugin) to fix the
  *shape* of the problem, but layer *priority* is order-of-first-appearance
  across the whole page, which only the consumer can pin: they must declare
  `@layer theme, base, stance, components, utilities;` (or their own Tailwind
  layer names, with `stance` in the equivalent middle position — see below)
  before importing Tailwind and stance's CSS, once, in their own global
  stylesheet. **`stance` must sit after `base`, not before it** — `base` is
  where Tailwind's preflight reset lives (it zeroes out things like borders),
  and putting `stance` first was tried and reverted after it broke real
  components (Accordion's divider borders silently disappeared, since the
  reset then outranked stance's own styling) — this is a two-sided mistake,
  not just an ordering nicety: `stance` before `base` breaks defaults,
  `stance` after `utilities` (or omitting the `@layer` line) breaks
  overrides. `apps/docs/theming.md`'s "Overriding a component's styling"
  section is what consumers see; `apps/playground/src/style.css` demonstrates
  the setup this repo's own dev playground uses. Never remove the
  `wrapStylesheetInLayer` plugin or the `:where()` convention without reading
  that doc section first — they're two halves of the same fix.
- **Theming via CSS custom properties**, split into two independently-selectable
  axes — **palette** (color, `data-theme-palette="..."`) and **density**
  (radius/spacing/typography/shadow-shape/control-geometry personality,
  `data-theme-density="..."`) — plus an orthogonal `class="dark"` mode toggle
  that applies to whichever palette/density are active. A legacy single-attribute
  `data-theme="..."` form (one of the 4 original bundled palette+density
  pairings) is kept as a permanent, byte-for-byte-compatible alias — see
  `design-docs/theme-axes.md` for the full palette/density split rationale and
  `apps/docs/theming.md` for the migration path. Components consume
  `var(--component-token, fallback)` — never hardcoded colors, radii, spacing,
  shadows, or control dimensions (dialog/popover/tooltip max-widths, avatar
  sizes, etc. are all density-owned tokens now, not hardcoded literals).
- **Tailwind-friendly**: components accept a `class` prop that merges (not
  replaces) with internal classes, using `tailwind-merge` to dedupe conflicts.
  (A per-part `ui` prop for compound components — e.g. distinctly targeting
  DataTable's header vs. row vs. cell — was considered but never built across
  the 25 shipped components; `class` alone already delivers the "override
  without specificity fights" story via `:where()`-wrapped internals, so a
  real per-part API is future work, not a documented guarantee today.)
- **Accessibility target: WCAG 2.1 AA / Section 508.** Every interactive component
  needs correct ARIA roles/states, full keyboard operability, and visible focus
  rings that survive theme overrides.
- **Responsive by default**: prefer container queries for component-internal
  layout shifts (e.g., DataTable collapsing to cards) over viewport breakpoints,
  since these are reusable components dropped into unknown layouts.
- **Every component ships with tests** (unit + accessibility) before being
  considered "done." No component is added to the public export until it has
  passing tests.

## Tech stack
- Build: Vite (library mode), TypeScript strict mode
- Styling: Tailwind CSS (peer dependency) + CSS custom properties for theme tokens
- Testing: Vitest + @vue/test-utils + @testing-library/vue + vitest-axe (or axe-core directly)
- Docs/dev playground: Histoire or a lightweight Vite app (decide in Phase 1)
- Monorepo tooling: pnpm workspaces (packages/core, packages/themes, apps/playground)

## Theme architecture
- Two independently-selectable axes, each its own TS object type, each
  compiled to CSS custom properties at build time via its own compiler
  function (`compilePalette`/`compileDensity` in `@stance-dev/themes`):
  - **`ColorPalette`**: every color role (`primary`, `destructive`, `surface`,
    etc.), split into `light`/`dark` token sets. 4 first-party palettes:
    `neutral`, `serious`, `fun`, `crisp`.
  - **`DensityProfile`**: radius, spacing, typography, control geometry
    (`ThemeControlTokens` — button/input heights, switch track size, overlay
    max-widths, avatar sizes, calendar cell size, etc.), and shadow (also
    split `light`/`dark`, since shadow opacity magnitude differs by mode even
    though shadow *shape* doesn't vary by palette). 4 first-party density
    profiles: `regular`, `compact`, `relaxed`, `comfortable`.
  - **Authoring rule**: density-profile shadows must stay neutral-color (pure
    black, any opacity) — shadow tracks personality (blur/spread/opacity),
    never a palette's hue. Nothing enforces this in the type system; it's a
    convention every first-party profile follows and any new one must too.
- Any palette combines with any density profile — 16 valid combinations from
  4×4, not just the 4 pairings that originally shipped bundled together as
  single "themes."
- Every palette and every density profile must define both a light and dark
  token set (colors/shadow respectively).
- Selection is a runtime attribute change (`data-theme-palette`,
  `data-theme-density`, `class="dark"`), not a rebuild.

## Component priority order
1. Primitives: Button, Input, Checkbox, Radio, Switch, Select, Textarea
2. Overlays: Dialog, Popover, Tooltip, Dropdown Menu
3. Composites: DataTable, Tabs, Accordion, Toast/Notification
4. Layout: Card, Grid helpers

Build primitives first as the *pattern reference* — get one primitive fully
right (theming, a11y, tests, responsive) before batch-producing the rest.

## Definition of done (per component)
- [ ] Props/slots typed, documented via TSDoc
- [ ] Uses only CSS custom properties for themeable values
- [ ] No `!important`; specificity verified low via `:where()`
- [ ] Keyboard nav + ARIA verified manually and via axe-core test
- [ ] Unit tests for all interactive states
- [ ] Responsive behavior verified at minimum 3 container widths
- [ ] Works correctly in all 4 palettes × light/dark (8 combinations) — the
      full axe/visual-regression matrix. Density is curated, not fully
      enumerated (see `design-docs/theme-axes.md` §4): one targeted
      neutral-palette + compact-density axe cross-check (both modes), plus a
      "Density" Histoire variant/visual baseline showing the default palette
      across all 4 density profiles, light mode only.

## Conventions
- File naming: PascalCase for component/story files (`Button.vue`, `Button.test.ts`,
  `Button.story.vue`), camelCase for composables/utilities (`useButton.ts`, `cn.ts`).
- CSS custom properties: prefixed `--stance-{category}-{token}`, e.g.
  `--stance-color-primary`, `--stance-radius-md`, `--stance-shadow-lg`,
  `--stance-text-sm`, `--stance-control-height-md`,
  `--stance-control-dialog-max-width`. Colors with interaction states follow
  `--stance-color-{role}[-foreground|-hover|-active]`. `color`/`text`/`font`
  categories are palette-owned; `radius`/`spacing`/`shadow`/`control`
  categories are density-owned (see "Theme architecture" above).
- Theme selector attributes: `data-theme-palette="<name>"` and
  `data-theme-density="<name>"`, independently settable on any ancestor
  element; `class="dark"` toggles mode for whichever palette/density are
  active. The legacy bundled `data-theme="<name>"` still works as a
  byte-compatible alias for one of the 4 original {palette, density} pairings
  — don't remove or special-case it without reading
  `design-docs/theme-axes.md` §3 first.
- Theme tokens: authored as plain resolved CSS values (hex/oklch/etc.), not live
  references to a consumer's Tailwind config. Pulling from `tailwindcss/colors` at
  authoring time is fine — the compiler bakes the resolved value into the token.
- pnpm is pinned via `packageManager` in the root `package.json`; run `pnpm install`
  after pulling to pick up version bumps.
- Docs/dev playground: Histoire (`apps/playground`), stories live at
  `src/**/*.story.vue`.
- Commit messages: [fill in]
- Model-naming convention (`modelValue` vs. a named `v-model`): a component's
  single primary piece of state is the default `modelValue` (Accordion's open
  item(s), Tabs' active tab). A component with no single primary state, or
  where the primary state isn't the thing being modeled, uses a named
  `v-model` instead (TreeTable's `v-model:expanded` — expansion isn't
  TreeTable's "value" the way the active tab is Tabs' "value"; DataTable/
  TreeTable have no default model at all, only named ones for
  sort/page/selected/etc.). This is deliberate, not inconsistent — apply the
  same reasoning to new components rather than defaulting every piece of
  state to a named model.
