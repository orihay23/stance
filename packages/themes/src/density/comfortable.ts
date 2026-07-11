import type { DensityProfile } from "../types";
import { crisp as crispTheme } from "../themes/crisp";

/**
 * "Comfortable" — decomposed from the legacy `crisp` theme's radius/
 * spacing/typography/shadow (derived, not retyped — byte-identical to what
 * `compileLegacyTheme` already emits for `crisp`). Control geometry is new
 * (theme-axes.md §1): scaled between "regular" and "compact", matching
 * `crisp`'s own radius/spacing scale, which its source comment already
 * describes as "slightly denser than neutral, roomier than serious."
 */
export const comfortable: DensityProfile = {
  name: "comfortable",
  radius: crispTheme.radius,
  spacing: crispTheme.spacing,
  typography: crispTheme.typography,
  control: {
    boxSize: "1.125rem",
    switchWidth: "2.25rem",
    switchThumbTravel: "1.125rem",
    heightSm: "1.875rem",
    heightMd: "2.25rem",
    heightLg: "2.75rem",
  },
  shadow: {
    light: crispTheme.light.shadow,
    dark: crispTheme.dark.shadow,
  },
};
