import type { ColorPalette } from "../types";
import { crisp as crispTheme } from "../themes/crisp";

/**
 * Derived directly from the legacy `crisp` theme's own color tokens (not
 * retyped) so this is guaranteed byte-identical to what `compileLegacyTheme`
 * already emits — a decomposition, not a redesign.
 */
export const crisp: ColorPalette = {
  name: "crisp",
  light: crispTheme.light.colors,
  dark: crispTheme.dark.colors,
};
