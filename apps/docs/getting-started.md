# Getting Started

## Install

stance is split into two packages: the components themselves, and the theme
token system they consume.

::: code-group

```sh [pnpm]
pnpm add @stance-dev/core @stance-dev/themes
```

```sh [npm]
npm install @stance-dev/core @stance-dev/themes
```

```sh [yarn]
yarn add @stance-dev/core @stance-dev/themes
```

:::

## Peer dependencies

`@stance-dev/core` declares two peer dependencies — install them yourself if your
project doesn't already have them:

- `vue` `^3.4.0`
- `tailwindcss` `^4.0.0`

Tailwind is a peer dependency, not a bundled dependency, on purpose: stance's
own components never emit Tailwind utility classes internally (see
[Accessibility](/accessibility) and [Theming](/theming) for why), and every
component accepts a `class` prop that merges with its internal classes via
`tailwind-merge`, so you can pass Tailwind utilities to override styling — a
plain utility class on your side wins over the internal default, with no
`!important` or specificity fight, **as long as you include the one-line
cascade-layer setup below**. See
[Theming § Overriding a component's styling](/theming#overriding-a-component-s-styling)
for why that line is necessary under Tailwind v4.

## Tailwind setup

stance targets **Tailwind CSS v4**, which is configured entirely in CSS. In
your project's main stylesheet:

```css
@layer theme, base, stance, components, utilities;
@import "tailwindcss";
@import "@stance-dev/core/style.css";
```

The `@layer` line matters, not just the two imports: `@stance-dev/core/style.css`
ships its CSS pre-wrapped in `@layer stance`, and that bare statement is what
tells the browser where `stance` sits relative to Tailwind's own layers —
*after* `base` (Tailwind's preflight reset, which zeroes out things like
borders, shouldn't beat an actual stance default) but *before* `utilities`
(so a Tailwind utility class still overrides a stance default). Get this
order wrong — e.g. put `stance` before `base` — and you'll see real visual
breakage (this exact mistake removed Accordion's divider borders during
development), not just a silent no-op like skipping the line entirely (see
[Theming](/theming#overriding-a-component-s-styling) for the full
cascade-layers explanation).

`@stance-dev/core/style.css` is the bundled structural CSS for every component —
layout, spacing, focus rings, all of it written against `--stance-*` CSS
custom properties rather than hardcoded values. On its own it has no colors,
because color (and every other themeable value) comes from a **theme**,
which you apply separately.

## Theme setup

Theming has two independently-selectable axes — **palette** (color) and
**density** (radius/spacing/typography/shadow personality) — each a plain
TypeScript object (see [Theming](/theming) for the full shapes) compiled to
a CSS custom property stylesheet at runtime via `compilePalette()`/
`compileDensity()`. Applying them takes two steps: inject the compiled CSS
once, and set both `data-theme-palette` and `data-theme-density` on a root
element.

```ts
import { compilePalette, compileDensity, allPalettes, allDensityProfiles } from "@stance-dev/themes";

const neutral = allPalettes.find((p) => p.name === "neutral")!;
const regular = allDensityProfiles.find((d) => d.name === "regular")!;

const style = document.createElement("style");
style.textContent = [compilePalette(neutral), compileDensity(regular)].join("\n\n");
document.head.appendChild(style);
```

```html
<html data-theme-palette="neutral" data-theme-density="regular">
  <!-- your app -->
</html>
```

In a real app you'd do the injection once, near your app's entry point,
rather than per-component — every component reads the same `--stance-*`
properties, so one compiled stylesheet covers all of them.

Already using the older single-attribute `data-theme="neutral"` form? It
still works unmodified — see [Theming § Migrating from `data-theme`](/theming#migrating-from-data-theme)
for the alias and why there's no urgency to switch.

### Dark mode

Add a `dark` class alongside the two `data-theme-*` attributes (on the same
element or an ancestor) to switch to dark-mode colors and shadows. Nothing
else changes — same components, same palette/density, just the class:

```html
<html data-theme-palette="neutral" data-theme-density="regular" class="dark">
  <!-- your app, now in dark mode -->
</html>
```

Toggling `dark` at runtime (e.g. from a theme-switcher control in your app)
re-renders every component in dark mode immediately — no rebuild, no page
reload, because the whole system is CSS custom properties resolved live by
the browser.

## Using a component

```vue
<script setup lang="ts">
import { Button } from "@stance-dev/core";
</script>

<template>
  <Button variant="primary" @click="doSomething">Save</Button>
</template>
```

Every component is a named export from `@stance-dev/core`; prop/slot/emit types
ship alongside it (e.g. `import { Button, type ButtonProps } from "@stance-dev/core"`).
See the [component list](/components) for what's available and a link to
each one's live, interactive examples.
