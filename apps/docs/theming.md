# Theming Guide

Every themeable value in stance — color, radius, spacing, shadow, typography
— is a CSS custom property, never a hardcoded value inside a component.
Components read `var(--stance-*, fallback)`; a theme is what actually
supplies those values. Switching themes, or switching between light and
dark, is a runtime attribute change on the page — not a rebuild.

## Two independent axes: palette and density

Theming is split into two independently-selectable axes, plus an orthogonal
light/dark toggle:

- **Palette** (`data-theme-palette`) — a coordinated set of ~14 color roles
  (`primary`, `destructive`, `surface`, and so on, each with `light`/`dark`
  variants).
- **Density** (`data-theme-density`) — a "personality": radius, spacing,
  typography scale, shadow shape, and control geometry (button/input
  heights, switch track size, overlay max-widths, avatar sizes, etc.).
- **Mode** (a `dark` class) — light/dark, applied on top of whichever
  palette and density are active. It's a binary toggle, not a third
  enumerable axis: every palette and every density profile ship both a
  light and dark variant, and `.dark` swaps both at once regardless of
  which palette/density are selected.

```html
<html data-theme-palette="neutral" data-theme-density="compact" class="dark">
```

Palette and density are genuinely independent — any palette combines with
any density profile via the ordinary CSS cascade, since each compiles to
its own, structurally separate rule block. Picking `vivid` palette +
`compact` density isn't a special case; it's the same mechanism as `vivid`
+ `regular`.

## The token system

Custom properties are prefixed `--stance-{category}-{token}`:

| Category | Example | Axis | Notes |
| --- | --- | --- | --- |
| Color | `--stance-color-primary` | Palette | See "Color roles" below for the `-foreground`/`-hover`/`-active` suffixes. |
| Radius | `--stance-radius-md` | Density | `none` / `sm` / `md` / `lg` / `xl` / `full` |
| Spacing | `--stance-spacing-md` | Density | `xs` / `sm` / `md` / `lg` / `xl` — internal component density, not a replacement for Tailwind's own spacing scale in your layout |
| Shadow | `--stance-shadow-md` | Density | `sm` / `md` / `lg` / `xl` — see "Shadow is density-owned" below |
| Typography | `--stance-text-sm`, `--stance-font-weight-medium`, `--stance-leading-normal`, `--stance-font-sans` | Density | |
| Control | `--stance-control-height-md`, `--stance-control-dialog-max-width` | Density | Component-specific geometry: control heights, switch track size, overlay max-widths, avatar sizes, calendar cell size. See "Control geometry" below. |

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

### Shadow is density-owned, not palette-owned

This is a deliberate, non-obvious decision worth stating explicitly: shadow
tracks a theme's **personality** (a flat, barely-there shadow reads
differently from a soft diffuse one), not its **color**. Every first-party
density profile authors shadows with a fixed neutral (black) color —
`oklch(0% 0 0 / <alpha>)` — and varies blur radius, spread, and opacity
magnitude instead. Color never enters a shadow value.

**Authoring rule for a new density profile: shadows must stay neutral-color
(pure black, any opacity).** Nothing in the type system enforces this today
— `ThemeShadowTokens` accepts any valid CSS color — so it's a convention,
not a compiler check. A profile that tints its shadows (e.g. a warm-tinted
shadow to match a "cozy" personality) would silently couple density to a
specific palette's hues, breaking the "any palette works with any density"
guarantee every other token in the system upholds. If a future density
profile genuinely wants a tinted shadow, that's a deliberate exception
worth its own design discussion, not something to introduce by accident.

### Control geometry

`ThemeControlTokens` (`boxSize`, `switchWidth`, `heightSm`/`heightMd`/
`heightLg`, `dialogMaxWidth`, `popoverMaxWidth`, `tooltipMaxWidth`,
`toastMinWidth`/`toastMaxWidth`, `calendarWidth`, `calendarCellSize`,
`avatarSizeSm`/`Md`/`Lg`/`Xl`, `progressBarTrackHeight`, and a few others)
is a density-owned group covering dimensions that used to be hardcoded
literals inside individual components (Dialog's `max-width: 32rem`,
Tooltip's `16rem`, Avatar's size scale, and so on) — now real tokens that
scale with the selected density profile like everything else.

## Anatomy of a palette and a density profile

```ts
interface ColorPalette {
  name: string;
  light: ThemeColorTokens;
  dark: ThemeColorTokens;
}

interface DensityProfile {
  name: string;
  radius: ThemeRadiusTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
  control: ThemeControlTokens;
  shadow: {
    light: ThemeShadowTokens;
    dark: ThemeShadowTokens;
  };
}
```

`stance` ships four first-party palettes — `neutral`, `serious`, `fun`, and
`crisp` — and four first-party density profiles — `regular`, `compact`,
`relaxed`, and `comfortable` — all exported from `@stance-dev/themes` via
`allPalettes` and `allDensityProfiles`. Pick one of each independently; there
are 16 valid combinations, not just the 4 pairings that originally shipped
bundled together (see "Migrating from `data-theme`" below for what those 4
original pairings were).

## Compiling and applying palette + density

`compilePalette(palette)` and `compileDensity(profile)` each turn their
object into a CSS string with two rule blocks:

```css
/* compilePalette(neutral) */
[data-theme-palette="neutral"] { /* light-mode colors */ }
[data-theme-palette="neutral"].dark { /* dark-mode colors */ }

/* compileDensity(compact) */
[data-theme-density="compact"] { /* radius/spacing/typography/control, plus light-mode shadow */ }
[data-theme-density="compact"].dark { /* dark-mode shadow only */ }
```

Inject both once (a `<style>` element is the simplest option) and set both
attributes on whatever element should be scoped to them — typically
`<html>` or your app's root:

```ts
import { compilePalette, compileDensity, allPalettes, allDensityProfiles } from "@stance-dev/themes";

// Note: the top-level `neutral` export is the *legacy* bundled Theme
// (palette + density combined) — for the new two-axis API, look up the
// palette/profile you want by name from allPalettes/allDensityProfiles.
const neutralPalette = allPalettes.find((p) => p.name === "neutral")!;
const regularDensity = allDensityProfiles.find((d) => d.name === "regular")!;

const style = document.createElement("style");
style.textContent = [compilePalette(neutralPalette), compileDensity(regularDensity)].join("\n\n");
document.head.appendChild(style);
```

```html
<html data-theme-palette="neutral" data-theme-density="regular">
```

`compilePalettes([paletteA, paletteB])` and
`compileDensityProfiles([profileA, profileB])` compile multiple of each
together if you want more than one available on the same page (e.g. for a
live switcher) — the two attributes pick which ones are active, independently.

Add a `dark` class (same element or an ancestor) for dark mode, same as
before — it applies to whichever palette and density are currently
selected, together. Because theming is just CSS custom properties resolved
by selectors, you can change any of the three (palette, density, mode) at
any point after the page has loaded — every component re-renders with the
new values immediately, no rebuild.

## Migrating from `data-theme`

If you're already using the single-attribute `data-theme="neutral"` form
(or `serious`/`fun`/`crisp`), **nothing breaks** — `compileTheme`/
`compileThemes`/`allThemes` are kept as permanent aliases that compile to
the exact same CSS output as before, verified byte-for-byte against the new
two-axis compiler. You'll see a one-time `console.error` in dev mode
pointing back here, but production behavior is unchanged and there's no
forced removal date.

Each old theme name decomposed into a `{ palette, density }` pair — the
density names are new (chosen to describe the actual spacing/radius/shadow
personality, not reused from the old theme names, so that e.g. `fun`
palette + `compact` density doesn't read as a contradiction):

| Old `data-theme` value | → `data-theme-palette` | → `data-theme-density` |
| --- | --- | --- |
| `neutral` | `neutral` | `regular` |
| `serious` | `serious` | `compact` |
| `fun` | `fun` | `relaxed` |
| `crisp` | `crisp` | `comfortable` |

To migrate, replace the single attribute with the two-attribute form using
the table above, and swap `compileTheme(theme)` for
`[compilePalette(palette), compileDensity(density)].join("\n\n")` (or use
the plural `compilePalettes`/`compileDensityProfiles` forms if you're
compiling more than one). Migrating unlocks picking any palette with any
density — if you don't need that yet, the legacy alias is not going away on
any particular schedule and there's no urgency to migrate today.

## Adding a custom palette or density profile

Author a `ColorPalette` and/or `DensityProfile` object matching the shapes
above and run them through `compilePalette()`/`compileDensity()` — nothing
about a "built-in" palette or profile is special beyond `@stance-dev/themes`
exporting some for you already. You can mix a custom palette with a
first-party density profile (or vice versa) freely.

```ts
import { compilePalette, type ColorPalette } from "@stance-dev/themes";

const brand: ColorPalette = {
  name: "brand",
  light: {
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
  dark: {
    /* same shape, dark-mode values */
  },
};

document.head.appendChild(
  Object.assign(document.createElement("style"), { textContent: compilePalette(brand) }),
);
```

```html
<html data-theme-palette="brand" data-theme-density="regular">
```

Author colors as plain resolved values (hex, `oklch()`, whatever your design
system uses) — pulling from a source like `tailwindcss/colors` at authoring
time is fine, since the compiler bakes the resolved value into the token
rather than keeping a live reference to your Tailwind config. If you author
a custom density profile, remember the shadow rule above: keep
`shadow.light`/`shadow.dark` neutral-color.

## Overriding a component's styling

Component CSS is written entirely with
[`:where()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where)-wrapped
selectors, keeping every internal rule at **specificity zero** — that part
of the design is real and verified (every component's `wraps default styles
in :where()` unit test checks it). Combined with `tailwind-merge` deduping
on each component's `class` prop, the intent is that a single Tailwind
utility class you pass always wins over the internal default, with no
`!important` and no specificity fight on your end.

**This requires one line of setup in your own global CSS**, and it's worth
explaining why rather than presenting it as a no-configuration guarantee:
Tailwind v4 compiles its own utility classes into a named CSS cascade layer
(`@layer utilities`), and its preflight reset into `@layer base`. Per the
CSS [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
specification, **an unlayered rule always wins over a layered one,
regardless of specificity** — so if stance shipped its `:where()` CSS
unlayered (as it did before this was fixed), a Tailwind utility class would
always lose to it despite having real, non-zero specificity against
stance's zero-specificity selectors. `@stance-dev/core/style.css` now ships its
own CSS pre-wrapped in `@layer stance`, which fixes the *shape* of the
problem, but cascade-layer **priority is order-of-first-appearance across
the whole page**, not something a library can pin from inside its own
stylesheet alone — so you need to declare where `stance` sits relative to
Tailwind's own layers, once, in your global CSS, before either import:

```css
@layer theme, base, stance, components, utilities;
@import "tailwindcss";
@import "@stance-dev/core/style.css";
```

`stance` has to sit in the *middle* of Tailwind's own layers, not at either
end: *after* `base` — Tailwind's preflight reset lives there, zeroing out
things like borders, and stance's real component styles need to win against
that raw reset, not lose to it — but *before* `utilities`, so a Tailwind
utility class still overrides a stance default. Get the order wrong in
either direction and something breaks, differently:

- **Skip the `@layer` line entirely** and you're back to the original bug —
  `stance` stays unlayered, so it beats `utilities` regardless, and a
  Tailwind utility class does nothing (verified: `p-8` on a stance
  `<Button>`'s `class` prop leaves its padding unchanged).
- **Put `stance` before `base`** (e.g. `@layer stance, base, ...`) and you
  get a different, worse bug: Tailwind's preflight reset now outranks
  stance's own styling, silently stripping things like Accordion's divider
  borders — a real regression hit during development, not a hypothetical.
  This is the mistake to actively avoid, not just an alternative ordering.
- **The order above** (`theme, base, stance, components, utilities`) is the
  one that's actually correct, and the one to copy.

What this means in practice, once the setup is correct:

- A Tailwind utility class passed via a component's `class` prop reliably
  overrides a conflicting internal default — the design's original intent,
  now actually realized.
- A plain CSS rule you write yourself (not a Tailwind utility — e.g. a class
  in your own stylesheet, or an inline `style` attribute) **also** overrides
  a component default regardless of the `@layer` setup, since an unlayered
  consumer rule still beats stance's now-layered CSS the same way it always
  would. Inline styles in particular always win.
- If you're on Tailwind v3 (no cascade layers at all) or don't use Tailwind,
  none of this applies — `:where()`'s zero specificity was already enough
  on its own, and still is.

This cuts the other way too: if a component's *default* rendering fails an
accessibility check, that's a bug in the library, not something you're
expected to work around with your own CSS — see
[Accessibility](/accessibility) for the accessibility-specific implications
of this override model.
