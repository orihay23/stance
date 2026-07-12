import type { ColorPalette } from "../types";
import { fun as funTheme } from "../themes/fun";

/**
 * Derived directly from the legacy `fun` theme's own color tokens (not
 * retyped) so this is guaranteed byte-identical to what `compileLegacyTheme`
 * already emits — a decomposition, not a redesign.
 */
export const fun: ColorPalette = {
  name: "fun",
  light: funTheme.light.colors,
  dark: funTheme.dark.colors,
};
