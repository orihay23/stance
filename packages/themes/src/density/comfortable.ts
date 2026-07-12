import type { DensityProfile } from "../types";
import { crisp as crispTheme } from "../themes/crisp";

/**
 * "Comfortable" — decomposed from the legacy `crisp` theme's radius/
 * spacing/typography/shadow (derived, not retyped — byte-identical to what
 * `compileLegacyTheme` already emits for `crisp`). Control geometry is new
 * (theme-axes.md §1): scaled between "regular" and "compact", matching
 * `crisp`'s own radius/spacing scale, which its source comment already
 * describes as "slightly denser than neutral, roomier than serious." The
 * Phase 14/D2 overlay-geometry fields below are scaled the same way, in
 * between "regular" and "compact" (theme-axes.md §5.1).
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
    dialogMaxWidth: "30rem",
    popoverMaxWidth: "18rem",
    tooltipMaxWidth: "15rem",
    toastMinWidth: "17rem",
    toastMaxWidth: "22rem",
    calendarWidth: "17rem",
    calendarCellSize: "1.875rem",
    avatarSizeSm: "1.625rem",
    avatarSizeMd: "2.25rem",
    avatarSizeLg: "3.25rem",
    avatarSizeXl: "4.5rem",
    progressBarTrackHeight: "0.4375rem",
  },
  shadow: {
    light: crispTheme.light.shadow,
    dark: crispTheme.dark.shadow,
  },
};
