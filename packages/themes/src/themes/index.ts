import type { Theme } from "../types";
import { neutral } from "./neutral";
import { serious } from "./serious";
import { fun } from "./fun";
import { crisp } from "./crisp";

export { neutral } from "./neutral";
export { serious } from "./serious";
export { fun } from "./fun";
export { crisp } from "./crisp";

/**
 * Every first-party theme, in one place. Every consumer that needs "the
 * list of themes" — Histoire's story theme switcher, the axe+theme-matrix
 * test helper, the visual-regression registry's per-theme capture
 * generation, the docs site's theme toggle — reads from this array rather
 * than maintaining its own copy, so adding a theme here is enough to cover
 * it everywhere automatically.
 *
 * @deprecated Kept unchanged, byte-for-byte, so every existing consumer
 * above keeps working unmodified after Phase 14's palette/density split —
 * see design-docs/theme-axes.md §3/§4. Prefer `allPalettes`/
 * `allDensityProfiles` (from `../palettes`/`../density`) for anything new.
 */
export const allThemes: readonly Theme[] = [neutral, serious, fun, crisp];

/**
 * Alias for `allThemes`, named for what it now is post-Phase-14: the 4
 * originally-shipped `{palette, density}` pairings, kept exactly as before
 * for consumers that haven't migrated yet. See design-docs/theme-axes.md §3.
 */
export const legacyThemes: readonly Theme[] = allThemes;
