import { ref } from "vue";
import { allThemes } from "@stance/themes";

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

export function useStoryTheme() {
  return { storyTheme, themes: allThemes };
}
