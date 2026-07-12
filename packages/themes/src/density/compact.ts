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
 * consistency-audit-2026-07.md §2.10 originally flagged). The Phase 14/D2
 * overlay-geometry fields below are scaled the same way — proportionally
 * smaller than "regular", since these were previously plain hardcoded
 * literals with no density behavior at all (theme-axes.md §5.1).
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
    dialogMaxWidth: "28rem",
    popoverMaxWidth: "16rem",
    tooltipMaxWidth: "14rem",
    toastMinWidth: "16rem",
    toastMaxWidth: "20rem",
    calendarWidth: "16rem",
    calendarCellSize: "1.75rem",
    avatarSizeSm: "1.5rem",
    avatarSizeMd: "2rem",
    avatarSizeLg: "3rem",
    avatarSizeXl: "4rem",
    progressBarTrackHeight: "0.375rem",
  },
  shadow: {
    light: seriousTheme.light.shadow,
    dark: seriousTheme.dark.shadow,
  },
};
