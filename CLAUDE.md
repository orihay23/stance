# Project: [stance] — Vue Component Library

## Mission
A PrimeVue-scoped alternative: opinionated, accessible, themeable Vue 3 component
library. Ships with 3–4 first-party themes (each with light/dark variants) but is
built so consumers can override styling via Tailwind without specificity fights.

## Non-negotiable constraints
- **Vue 3 + `<script setup>` + TypeScript** for every component.
- **No `!important` anywhere.** Base styles must have low, predictable specificity
  so a single Tailwind utility class on the consumer's side wins by default.
  Prefer `:where()` wrapping for structural/default styles to keep specificity at 0.
- **Theming via CSS custom properties**, one token set per theme, swapped by a
  root-level `data-theme="..."` attribute (and `class="dark"` for color mode).
  Components consume `var(--component-token, fallback)` — never hardcoded colors.
- **Tailwind-friendly**: components accept a `class`/`ui` prop that merges (not
  replaces) with internal classes, using `tailwind-merge` to dedupe conflicts.
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
- Each theme = a TS object of design tokens (color, radius, spacing scale,
  shadow, typography) compiled to CSS custom properties at build time.
- Default themes: pick 3–4 distinct personalities (e.g., "Neutral", "Vivid",
  "Corporate", "Playful") — not just color swaps, vary radius/shadow/density too.
- Every theme must define both a light and dark token set.
- Theme switching is a runtime attribute change, not a rebuild.

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
- [ ] Works correctly in all 4 themes × light/dark (8 combinations)

## Conventions
- File naming, prop naming, event naming standards: [fill in once decided]
- Commit messages: [fill in]
