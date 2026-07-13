# Getting Started

## Install

stance is split into two packages: the components themselves, and the theme
token system they consume.

::: code-group

```sh [pnpm]
pnpm add @stance/core @stance/themes
```

```sh [npm]
npm install @stance/core @stance/themes
```

```sh [yarn]
yarn add @stance/core @stance/themes
```

:::

## Peer dependencies

`@stance/core` declares two peer dependencies — install them yourself if your
project doesn't already have them:

- `vue` `^3.4.0`
- `tailwindcss` `^4.0.0`

Tailwind is a peer dependency, not a bundled dependency, on purpose: stance's
own components never emit Tailwind utility classes internally (see
[Accessibility](/accessibility) and [Theming](/theming) for why), and every
component accepts a `class` prop that merges with its internal classes via
`tailwind-merge`, so you can pass Tailwind utilities to override styling.
**Read [Theming § Overriding a component's styling](/theming#overriding-a-component-s-styling)
before relying on this** — under Tailwind v4's default setup there's a
known, currently-unresolved gap where a Tailwind utility class doesn't
reliably win over a component's internal default; a plain CSS rule or
inline style in your own stylesheet does work today.

## Tailwind setup

stance targets **Tailwind CSS v4**, which is configured entirely in CSS. In
your project's main stylesheet:

```css
@import "tailwindcss";
@import "@stance/core/style.css";
```

`@stance/core/style.css` is the bundled structural CSS for every component —
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
import { compilePalette, compileDensity, allPalettes, allDensityProfiles } from "@stance/themes";

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
import { Button } from "@stance/core";
</script>

<template>
  <Button variant="primary" @click="doSomething">Save</Button>
</template>
```

Every component is a named export from `@stance/core`; prop/slot/emit types
ship alongside it (e.g. `import { Button, type ButtonProps } from "@stance/core"`).
See the [component list](/components) for what's available and a link to
each one's live, interactive examples.
