import type { DensityProfile } from "../types";
import { neutral as neutralTheme } from "../themes/neutral";

/**
 * "Regular" — the default density, decomposed from the legacy `neutral`
 * theme's radius/spacing/typography/shadow (derived, not retyped, so this
 * stays byte-identical to what `compileLegacyTheme` already emits for
 * `neutral`). Control geometry is genuinely new data — these tokens were
 * previously unwired `var(--stance-control-*, <this exact value>)`
 * fallbacks in Button/Checkbox/Radio/Switch (theme-axes.md §1), so
 * "regular" reuses those existing fallback values as its baseline: this
 * profile is what every theme already rendered as before density became
 * independently selectable.
 */
export const regular: DensityProfile = {
  name: "regular",
  radius: neutralTheme.radius,
  spacing: neutralTheme.spacing,
  typography: neutralTheme.typography,
  control: {
    boxSize: "1.25rem",
    switchWidth: "2.5rem",
    switchThumbTravel: "1.25rem",
    heightSm: "2rem",
    heightMd: "2.5rem",
    heightLg: "3rem",
  },
  shadow: {
    light: neutralTheme.light.shadow,
    dark: neutralTheme.dark.shadow,
  },
};
