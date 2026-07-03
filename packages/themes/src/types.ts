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
 */
export interface Theme {
  name: string;
  light: ThemeModeTokens;
  dark: ThemeModeTokens;
  radius: ThemeRadiusTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
}
