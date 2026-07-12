import type { DensityProfile } from "../types";
import { regular } from "./regular";
import { compact } from "./compact";
import { relaxed } from "./relaxed";
import { comfortable } from "./comfortable";

export { regular } from "./regular";
export { compact } from "./compact";
export { relaxed } from "./relaxed";
export { comfortable } from "./comfortable";

/**
 * Every first-party density profile, in one place — the density-axis
 * counterpart of `allPalettes` (see `../palettes`). See
 * design-docs/theme-axes.md §4 for why downstream consumers should read
 * from this rather than maintaining their own copy.
 */
export const allDensityProfiles: readonly DensityProfile[] = [regular, compact, relaxed, comfortable];
