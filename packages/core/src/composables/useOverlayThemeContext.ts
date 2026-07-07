import type { ComputedRef, Ref } from "vue";
import { ref, watch } from "vue";
import { detectThemeContext, type ThemeContext } from "../utils/theme-context";

/**
 * Detects the ambient `data-theme`/`.dark` context (see
 * utils/theme-context.ts) at the moment an overlay opens, and keeps it as a
 * ref for the teleported content to apply to itself — shared by every
 * overlay that teleports outside its trigger's themed DOM subtree.
 */
export function useOverlayThemeContext(
  open: Ref<boolean> | ComputedRef<boolean>,
  resolveAnchor: () => Element | null | undefined,
): Ref<ThemeContext> {
  const themeContext = ref(detectThemeContext(null));
  watch(open, (isOpen) => {
    if (isOpen) themeContext.value = detectThemeContext(resolveAnchor());
  });
  return themeContext;
}
