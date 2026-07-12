/**
 * A themeable color role: a default value, its accessible foreground
 * (text/icon color placed on top of it), and interaction-state variants.
 * `hover`/`active` are optional because not every role needs them
 * (e.g. `border` is just a single value).
 */
export interface ColorRole {
  DEFAULT: string;
  foreground: string;
  hover?: string;
  active?: string;
}

export interface ThemeColorTokens {
  background: string;
  foreground: string;
  surface: ColorRole;
  overlay: string;
  border: string;
  ring: string;
  primary: ColorRole;
  secondary: ColorRole;
  accent: ColorRole;
  muted: ColorRole;
  destructive: ColorRole;
  success: ColorRole;
  warning: ColorRole;
  info: ColorRole;
}

export interface ThemeShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Tokens that are expected to differ between light and dark mode:
 * colors obviously, but also shadows (dark surfaces usually trade
 * soft drop-shadows for lighter borders/higher-contrast shadows).
 */
export interface ThemeModeTokens {
  colors: ThemeColorTokens;
  shadow: ThemeShadowTokens;
}

export interface ThemeRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Internal component density (padding/gap steps), not a replacement
 * for Tailwind's spacing scale. Consumers still use Tailwind utilities
 * for layout around components.
 */
export interface ThemeSpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeTypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

/**
 * A complete theme: a "personality" (radius/spacing/typography) shared
 * across color modes, plus a light and dark token set for everything
 * that must adapt to color mode.
 *
 * @deprecated Bundles what Phase 14 (see design-docs/theme-axes.md) split
 * into two independently-selectable axes: `ColorPalette` and
 * `DensityProfile`. Kept only as the shape `legacyThemes`/`allThemes` and
 * `compileLegacyTheme`/`compileTheme` still operate on, so existing
 * `data-theme="..."` consumers keep working unmodified. Prefer
 * `ColorPalette` + `DensityProfile` for anything new.
 */
export interface Theme {
  name: string;
  light: ThemeModeTokens;
  dark: ThemeModeTokens;
  radius: ThemeRadiusTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
}

/**
 * Component control geometry (checkbox/radio box size, switch track/thumb
 * dimensions, button min-heights) — density-owned per theme-axes.md §1,
 * since every value here is a dimension, never a color. Previously these
 * existed only as unwired `var(--stance-control-*, <fallback>)` escape
 * hatches in Button/Checkbox/Radio/Switch (Phase 8 Tier 3 fix for
 * consistency-audit-2026-07.md §2.10) — no theme ever set them, so control
 * geometry stayed identical across every theme regardless of its
 * radius/spacing scale. This type is what a `DensityProfile` now uses to
 * actually populate them.
 */
export interface ThemeControlTokens {
  /** Checkbox/Radio's square box, and Switch track's height. */
  boxSize: string;
  /** Switch track width. */
  switchWidth: string;
  /** Switch thumb's checked-state translateX distance. */
  switchThumbTravel: string;
  heightSm: string;
  heightMd: string;
  heightLg: string;
  /**
   * Overlay geometry (Phase 14/D2 — theme-axes.md §5.1: these were
   * hardcoded literals with no density-axis behavior at all, unlike
   * boxSize/switchWidth/height* above which at least had unwired
   * `var(--stance-control-*, <fallback>)` escape hatches already).
   */
  dialogMaxWidth: string;
  popoverMaxWidth: string;
  tooltipMaxWidth: string;
  toastMinWidth: string;
  toastMaxWidth: string;
  /** Calendar's own root width, and DatePicker's popover via composition. */
  calendarWidth: string;
  /** Calendar's day-cell height. */
  calendarCellSize: string;
  avatarSizeSm: string;
  avatarSizeMd: string;
  avatarSizeLg: string;
  avatarSizeXl: string;
  progressBarTrackHeight: string;
}

/**
 * A selectable color axis: every color role, for both light and dark mode.
 * No radius/spacing/typography/shadow — those are `DensityProfile`'s job.
 * See design-docs/theme-axes.md §1/§4.
 */
export interface ColorPalette {
  name: string;
  light: ThemeColorTokens;
  dark: ThemeColorTokens;
}

/**
 * A selectable density/personality axis: radius, spacing, typography, and
 * control geometry (mode-independent — none of these are colors), plus
 * shadow (density-owned per theme-axes.md §1: shadow *shape* tracks
 * personality, not palette, and no shipped theme tints its shadow color —
 * every shadow value is neutral black at some alpha). Shadow's alpha still
 * needs a light/dark pair since it visibly changes between modes, so it's
 * the one field here shaped like `ThemeModeTokens` rather than a flat
 * value.
 */
export interface DensityProfile {
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
