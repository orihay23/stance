import { ref } from "vue";
import { allDensityProfiles, allThemes } from "@stance-dev/themes";

/**
 * Module-level (not per-story) so picking a theme in the global switcher
 * (see ThemeSwitcherWrapper.vue) applies to every story at once, and so
 * the visual-tests registry can drive it externally via a `?theme=` query
 * param without any per-story wiring — every story's `data-theme` binding
 * reads this same ref, so a new theme in `allThemes` shows up everywhere
 * automatically.
 */
const initialName = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("theme") : null;
export const storyTheme = ref(allThemes.find((t) => t.name === initialName)?.name ?? allThemes[0]!.name);

/**
 * Phase 14/D3's density-axis counterpart to `storyTheme` — see
 * design-docs/theme-axes.md §6/D3. Existing stories' `data-theme` bindings
 * are untouched (still the legacy bundled axis), so this doesn't affect
 * anything already rendered; it's the axis new palette/density-aware story
 * content (e.g. each component's "Density" variant) binds to via
 * `data-theme-density`.
 */
const initialDensityName =
  typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("density") : null;
export const storyDensity = ref(
  allDensityProfiles.find((d) => d.name === initialDensityName)?.name ?? allDensityProfiles[0]!.name,
);

export function useStoryTheme() {
  return { storyTheme, themes: allThemes, storyDensity, densityProfiles: allDensityProfiles };
}
