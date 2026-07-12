import type { ColorPalette } from "../types";
import { serious as seriousTheme } from "../themes/serious";

/**
 * Derived directly from the legacy `serious` theme's own color tokens
 * (not retyped) so this is guaranteed byte-identical to what
 * `compileLegacyTheme` already emits — a decomposition, not a redesign.
 */
export const serious: ColorPalette = {
  name: "serious",
  light: seriousTheme.light.colors,
  dark: seriousTheme.dark.colors,
};
