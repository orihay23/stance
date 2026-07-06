import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject } from "vue";

export interface SplitterPaneConstraints {
  /** Minimum size, as a percentage of the splitter's total. */
  min: ComputedRef<number>;
  /** Maximum size, as a percentage of the splitter's total. */
  max: ComputedRef<number>;
}

export interface SplitterContext {
  orientation: ComputedRef<"horizontal" | "vertical">;
  /** Resize increment (percentage points) for arrow-key operation on a divider. */
  step: ComputedRef<number>;
  /** Registered pane ids, in DOM order — a pane's index into this array is also its index into `sizes`. */
  paneIds: Ref<string[]>;
  /** Current size (percentage) of each registered pane, in the same order as `paneIds`. */
  sizes: ComputedRef<number[]>;
  registerPane: (id: string, constraints: SplitterPaneConstraints) => void;
  unregisterPane: (id: string) => void;
  /**
   * Resizes the pane pair adjacent to the divider before `paneIds[index]` —
   * i.e. `paneIds[index - 1]` and `paneIds[index]`. `delta` (percentage
   * points, positive grows the preceding pane) is clamped so neither pane
   * exceeds its own min/max; the pair's combined size never changes, so
   * every other pane is left untouched.
   */
  resizePair: (index: number, delta: number) => void;
  /** The splitter's own root element — dividers read its bounding rect to convert drag position into a percentage. */
  containerRef: Ref<HTMLElement | null>;
}

export const SPLITTER_KEY: InjectionKey<SplitterContext> = Symbol("Splitter");

/** Reads the enclosing Splitter's context; warns in dev mode if there isn't one. */
export function useSplitterContext(componentName: string): SplitterContext | undefined {
  const context = inject(SPLITTER_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <Splitter>.`);
  }
  return context;
}
