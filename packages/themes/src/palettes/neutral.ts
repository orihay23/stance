import type { ColorPalette } from "../types";
import { neutral as neutralTheme } from "../themes/neutral";

/**
 * Derived directly from the legacy `neutral` theme's own color tokens
 * (not retyped) so this is guaranteed byte-identical to what
 * `compileLegacyTheme` already emits — a decomposition, not a redesign.
 */
export const neutral: ColorPalette = {
  name: "neutral",
  light: neutralTheme.light.colors,
  dark: neutralTheme.dark.colors,
};
