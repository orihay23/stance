import type { Theme } from "../types";
import { neutral } from "./neutral";
import { serious } from "./serious";
import { fun } from "./fun";

export { neutral } from "./neutral";
export { serious } from "./serious";
export { fun } from "./fun";

/**
 * Every first-party theme, in one place. Every consumer that needs "the
 * list of themes" — Histoire's story theme switcher, the axe+theme-matrix
 * test helper, the visual-regression registry's per-theme capture
 * generation, the docs site's theme toggle — reads from this array rather
 * than maintaining its own copy, so adding a theme here is enough to cover
 * it everywhere automatically.
 */
export const allThemes: readonly Theme[] = [neutral, serious, fun];
