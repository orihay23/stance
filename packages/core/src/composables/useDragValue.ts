import type { ComputedRef, Ref } from "vue";
import { onUnmounted } from "vue";

export interface UseDragValueOptions {
  /** Determines which Arrow keys map to "step positive"/"step negative" — horizontal: Right/Left, vertical: Down/Up. */
  orientation: ComputedRef<"horizontal" | "vertical"> | Ref<"horizontal" | "vertical">;
  /** Called on pointerdown, before pointer capture and the window-level move/up listeners are attached. */
  onDragStart?: (event: PointerEvent) => void;
  /** Called on every pointermove while dragging — do the domain-specific math here (delta-from-last-position for Splitter's pane pairs, absolute-position-on-track for Slider's thumb). */
  onDragMove: (event: PointerEvent) => void;
  /** Called once on pointerup, after the window-level listeners are removed. */
  onDragEnd?: (event: PointerEvent) => void;
  /** ArrowRight (horizontal) / ArrowDown (vertical). */
  onStepPositive: () => void;
  /** ArrowLeft (horizontal) / ArrowUp (vertical). */
  onStepNegative: () => void;
  /** Home — jump to the minimum. Omit to leave Home unhandled. */
  onJumpToMin?: () => void;
  /** End — jump to the maximum. Omit to leave End unhandled. */
  onJumpToMax?: () => void;
}

export interface UseDragValueResult {
  onPointerDown: (event: PointerEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
}

/**
 * Shared pointer-drag + keyboard-step plumbing behind both Splitter's
 * divider (pane-pair resizing, delta-based) and Slider's thumb (absolute
 * track-position-based) — pointer capture, the window-level pointermove/
 * pointerup listener lifecycle (attached only while dragging, always
 * cleaned up), and orientation-aware Arrow/Home/End key dispatch. The
 * actual value math is domain-specific and stays with the caller via
 * `onDragMove`/`onStepPositive`/etc.
 */
export function useDragValue(options: UseDragValueOptions): UseDragValueResult {
  function onPointerMove(event: PointerEvent) {
    options.onDragMove(event);
  }

  function onPointerUp(event: PointerEvent) {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    options.onDragEnd?.(event);
  }

  function onPointerDown(event: PointerEvent) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    options.onDragStart?.(event);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onKeydown(event: KeyboardEvent) {
    const horizontal = options.orientation.value === "horizontal";
    const positiveKey = horizontal ? "ArrowRight" : "ArrowDown";
    const negativeKey = horizontal ? "ArrowLeft" : "ArrowUp";

    if (event.key === positiveKey) {
      event.preventDefault();
      options.onStepPositive();
    } else if (event.key === negativeKey) {
      event.preventDefault();
      options.onStepNegative();
    } else if (event.key === "Home" && options.onJumpToMin) {
      event.preventDefault();
      options.onJumpToMin();
    } else if (event.key === "End" && options.onJumpToMax) {
      event.preventDefault();
      options.onJumpToMax();
    }
  }

  onUnmounted(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  });

  return { onPointerDown, onKeydown };
}
