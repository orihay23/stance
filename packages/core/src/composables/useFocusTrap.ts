import type { ComputedRef, Ref } from "vue";
import { nextTick, watch } from "vue";
import { getFocusableElements } from "../utils/dom";

export interface UseFocusTrapOptions {
  /** The element to trap focus within. Needs `tabindex="-1"` in the template so it's a valid fallback focus target when it has no focusable descendants. */
  container: Ref<HTMLElement | null | undefined>;
  /** Whether the trap is currently active. */
  active: Ref<boolean> | ComputedRef<boolean>;
  /** Element to focus when the trap activates. Defaults to the first focusable descendant, or the container itself if there isn't one. */
  initialFocus?: Ref<HTMLElement | null | undefined>;
}

/**
 * Traps Tab/Shift+Tab within `container` while `active`, and restores focus
 * to whatever had it beforehand once deactivated. Used by Dialog, and any
 * Dropdown Menu opened via keyboard — not by Tooltip, which isn't
 * interactive by itself and has nothing to trap focus in.
 */
export function useFocusTrap(options: UseFocusTrapOptions): void {
  const { container, active, initialFocus } = options;
  let previouslyFocused: HTMLElement | null = null;

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Tab" || !container.value) return;

    const focusable = getFocusableElements(container.value);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const current = document.activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    } else if (!container.value.contains(current)) {
      // Focus somehow escaped the container (e.g. a timing edge case) — pull it back in.
      event.preventDefault();
      first.focus();
    }
  }

  watch(
    active,
    async (isActive) => {
      if (isActive) {
        previouslyFocused = document.activeElement as HTMLElement | null;
        document.addEventListener("keydown", onKeydown, true);

        await nextTick(); // wait for the container to actually be in the DOM (v-if/Teleport)
        if (!container.value) return;
        const target = initialFocus?.value ?? getFocusableElements(container.value)[0] ?? container.value;
        target.focus();
      } else {
        document.removeEventListener("keydown", onKeydown, true);
        previouslyFocused?.focus();
        previouslyFocused = null;
      }
    },
    { immediate: true },
  );
}
