import type { DensityProfile } from "../types";
import { serious as seriousTheme } from "../themes/serious";

/**
 * "Compact" — decomposed from the legacy `serious` theme's radius/spacing/
 * typography/shadow (derived, not retyped — byte-identical to what
 * `compileLegacyTheme` already emits for `serious`). Control geometry is
 * new (theme-axes.md §1): scaled down from "regular"'s baseline in step
 * with `serious`'s own near-half radius scale and denser spacing, so a
 * `compact`-density Button/Checkbox/Radio/Switch actually reads as denser
 * once density becomes independently selectable, rather than staying
 * "regular"-sized regardless of the chosen density (the exact gap
 * consistency-audit-2026-07.md §2.10 originally flagged).
 */
export const compact: DensityProfile = {
  name: "compact",
  radius: seriousTheme.radius,
  spacing: seriousTheme.spacing,
  typography: seriousTheme.typography,
  control: {
    boxSize: "1rem",
    switchWidth: "2rem",
    switchThumbTravel: "1rem",
    heightSm: "1.75rem",
    heightMd: "2rem",
    heightLg: "2.5rem",
  },
  shadow: {
    light: seriousTheme.light.shadow,
    dark: seriousTheme.dark.shadow,
  },
};
