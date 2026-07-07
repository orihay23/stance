import type { Theme } from "../types";
import { neutral } from "./neutral";

export { neutral } from "./neutral";

/**
 * Every first-party theme, in one place. Every consumer that needs "the
 * list of themes" — Histoire's story theme switcher, the axe+theme-matrix
 * test helper, the visual-regression registry's per-theme capture
 * generation, the docs site's theme toggle — reads from this array rather
 * than maintaining its own copy, so adding a theme here is enough to cover
 * it everywhere automatically.
 */
export const allThemes: readonly Theme[] = [neutral];
