import type { ColorPalette } from "../types";
import { neutral } from "./neutral";
import { serious } from "./serious";
import { fun } from "./fun";
import { crisp } from "./crisp";

export { neutral } from "./neutral";
export { serious } from "./serious";
export { fun } from "./fun";
export { crisp } from "./crisp";

/**
 * Every first-party color palette, in one place — the palette-axis
 * counterpart of `allDensityProfiles` (see `../density`). See
 * design-docs/theme-axes.md §4 for why downstream consumers should read
 * from this rather than maintaining their own copy.
 */
export const allPalettes: readonly ColorPalette[] = [neutral, serious, fun, crisp];
