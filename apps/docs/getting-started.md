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
[Accessibility](/accessibility) and [Theming](/theming) for why), but your
Tailwind setup is how you're expected to *override* their styling — a plain
utility class on your side always wins, with no specificity fight.

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

A theme is a plain TypeScript object (see [Theming](/theming) for the full
shape) compiled to a CSS custom property stylesheet at runtime via
`compileTheme()`. Applying one takes two steps: inject the compiled CSS once,
and set `data-theme` on a root element so it matches the theme's `name`.

```ts
import { compileTheme, neutral } from "@stance/themes";

const style = document.createElement("style");
style.textContent = compileTheme(neutral);
document.head.appendChild(style);
```

```html
<html data-theme="neutral">
  <!-- your app -->
</html>
```

In a real app you'd do the injection once, near your app's entry point,
rather than per-component — every component reads the same `--stance-*`
properties, so one compiled stylesheet covers all of them.

### Dark mode

Add a `dark` class alongside `data-theme` (on the same element or an
ancestor) to switch to the theme's dark token set. Nothing else changes —
same components, same `data-theme` value, just the class:

```html
<html data-theme="neutral" class="dark">
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
