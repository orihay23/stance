import type { DensityProfile } from "../types";
import { fun as funTheme } from "../themes/fun";

/**
 * "Relaxed" — decomposed from the legacy `fun` theme's radius/spacing/
 * typography/shadow (derived, not retyped — byte-identical to what
 * `compileLegacyTheme` already emits for `fun`). Control geometry is new
 * (theme-axes.md §1): scaled up from "regular"'s baseline in step with
 * `fun`'s own roughly-double radius scale and roomier spacing.
 */
export const relaxed: DensityProfile = {
  name: "relaxed",
  radius: funTheme.radius,
  spacing: funTheme.spacing,
  typography: funTheme.typography,
  control: {
    boxSize: "1.5rem",
    switchWidth: "3rem",
    switchThumbTravel: "1.5rem",
    heightSm: "2.25rem",
    heightMd: "2.75rem",
    heightLg: "3.25rem",
  },
  shadow: {
    light: funTheme.light.shadow,
    dark: funTheme.dark.shadow,
  },
};
