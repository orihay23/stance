# Theming Guide

Every themeable value in stance — color, radius, spacing, shadow, typography
— is a CSS custom property, never a hardcoded value inside a component.
Components read `var(--stance-*, fallback)`; themes are what actually supply
those values. Switching themes, or switching between light and dark, is a
runtime attribute change on the page — not a rebuild.

## The token system

Custom properties are prefixed `--stance-{category}-{token}`:

| Category | Example | Notes |
| --- | --- | --- |
| Color | `--stance-color-primary` | See "Color roles" below for the `-foreground`/`-hover`/`-active` suffixes. |
| Radius | `--stance-radius-md` | `none` / `sm` / `md` / `lg` / `xl` / `full` |
| Spacing | `--stance-spacing-md` | `xs` / `sm` / `md` / `lg` / `xl` — internal component density, not a replacement for Tailwind's own spacing scale in your layout |
| Shadow | `--stance-shadow-md` | `sm` / `md` / `lg` / `xl` |
| Typography | `--stance-text-sm`, `--stance-font-weight-medium`, `--stance-leading-normal`, `--stance-font-sans` | |

### Color roles

Colors that need interaction states (`primary`, `secondary`, `accent`,
`muted`, `destructive`, `success`, `warning`, `info`, plus `surface`) are a
**role**, not a single value:

```
--stance-color-primary             /* the color itself */
--stance-color-primary-foreground  /* text/icon color placed on top of it */
--stance-color-primary-hover       /* optional */
--stance-color-primary-active      /* optional */
```

A few tokens are single values with no role (`background`, `foreground`,
`border`, `ring`, `overlay`) since nothing is ever painted on top of them the
way a button's foreground sits on its background.

## Anatomy of a theme

A theme is a plain TypeScript object satisfying the `Theme` interface from
`@stance/themes`:

```ts
interface Theme {
  name: string;
  light: ThemeModeTokens; // colors + shadow
  dark: ThemeModeTokens; // colors + shadow
  radius: ThemeRadiusTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
}
```

Colors and shadows are split into `light`/`dark` because those are the
values expected to change with color mode. `radius`, `spacing`, and
`typography` are a theme's "personality" — density, roundedness, type scale —
and stay constant across light/dark; only the color mode swaps.

`stance` ships one reference theme today, `neutral`, exported from
`@stance/themes`. The token shape is designed for more distinct personalities
(not just color swaps — varying radius/shadow/density too) to ship over
time.

## Compiling and applying a theme

`compileTheme(theme)` turns a `Theme` object into a CSS string with two rule
blocks:

```css
[data-theme="neutral"] {
  /* light-mode colors/shadow, plus radius/spacing/typography */
}
[data-theme="neutral"].dark {
  /* dark-mode colors/shadow only */
}
```

Inject that string once (a `<style>` element is the simplest option) and set
`data-theme="neutral"` on whatever element should be scoped to that theme —
typically `<html>` or your app's root:

```ts
import { compileTheme, neutral } from "@stance/themes";

const style = document.createElement("style");
style.textContent = compileTheme(neutral);
document.head.appendChild(style);
```

```html
<html data-theme="neutral">
```

Add a `dark` class (same element or an ancestor) for dark mode. Because
theming is just CSS custom properties resolved by selectors, you can toggle
`dark`, or even swap `data-theme` to a different theme name entirely, at any
point after the page has loaded — every component re-renders with the new
values immediately.

Multiple themes can be compiled together with `compileThemes([themeA, themeB])`
if you want more than one theme's CSS available on the same page (e.g. for a
live theme switcher) — the `data-theme` attribute picks which one is active.

## Adding a custom theme

Author your own object matching the `Theme` shape and run it through the
same `compileTheme()` used for `neutral` — nothing about a "built-in" theme
is special beyond the fact that `@stance/themes` exports one for you already.

```ts
import { compileTheme, type Theme } from "@stance/themes";

const brand: Theme = {
  name: "brand",
  light: {
    colors: {
      background: "oklch(100% 0 0)",
      foreground: "oklch(20% 0 0)",
      surface: { DEFAULT: "oklch(98% 0 0)", foreground: "oklch(20% 0 0)" },
      overlay: "oklch(0% 0 0 / 0.4)",
      border: "oklch(90% 0 0)",
      ring: "oklch(55% 0.2 265)",
      primary: {
        DEFAULT: "oklch(55% 0.2 265)",
        foreground: "oklch(100% 0 0)",
        hover: "oklch(50% 0.2 265)",
      },
      // ...secondary, accent, muted, destructive, success, warning, info
    },
    shadow: { sm: "0 1px 2px oklch(0% 0 0 / 0.05)", md: "…", lg: "…", xl: "…" },
  },
  dark: {
    /* same shape, dark-mode values */
  },
  radius: { none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" },
  typography: {
    /* fontFamily, fontSize, fontWeight, lineHeight — see ThemeTypographyTokens */
  },
};

document.head.appendChild(
  Object.assign(document.createElement("style"), { textContent: compileTheme(brand) }),
);
```

```html
<html data-theme="brand">
```

Author colors as plain resolved values (hex, `oklch()`, whatever your design
system uses) — pulling from a source like `tailwindcss/colors` at authoring
time is fine, since the compiler bakes the resolved value into the token
rather than keeping a live reference to your Tailwind config.

## Overriding a component's styling

Because component CSS is `:where()`-wrapped (zero specificity) and reads
theme tokens with sensible fallbacks, a single Tailwind utility class passed
via a component's `class` prop wins over the internal default without
`!important` or any specificity workaround on your end. See
[Accessibility](/accessibility) for the full rationale.
