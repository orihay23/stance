import type { ComputedRef, Ref } from "vue";
import { nextTick, watch } from "vue";

export interface UseDismissableOptions {
  /** Whether dismiss listeners are currently active. */
  active: Ref<boolean> | ComputedRef<boolean>;
  /** Called when Escape, an outside click, or (if enabled) scroll should close the overlay. */
  onDismiss: () => void;
  /** Elements a click *inside* does not count as "outside" (e.g. the overlay panel, and its trigger). */
  containers: Array<Ref<HTMLElement | null | undefined>>;
  /** @default true */
  closeOnEscape?: Ref<boolean> | ComputedRef<boolean>;
  /** @default true */
  closeOnOutsideClick?: Ref<boolean> | ComputedRef<boolean>;
}

/**
 * Shared Escape/click-outside dismiss behavior for Dialog, Popover, Tooltip,
 * and Dropdown Menu, so each component doesn't reimplement it.
 */
export function useDismissable(options: UseDismissableOptions): void {
  const { active, onDismiss, containers } = options;

  function isInsideAnyContainer(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) return false;
    return containers.some((c) => c.value?.contains(target));
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && (options.closeOnEscape?.value ?? true)) {
      onDismiss();
    }
  }

  function onPointerDown(event: PointerEvent) {
    if ((options.closeOnOutsideClick?.value ?? true) && !isInsideAnyContainer(event.target)) {
      onDismiss();
    }
  }

  watch(
    active,
    async (isActive) => {
      if (isActive) {
        // Deferred a tick so the same click that opened the overlay (still
        // dispatching when `active` flips true) isn't also seen by this
        // listener and immediately closes it again.
        await nextTick();
        document.addEventListener("keydown", onKeydown);
        document.addEventListener("pointerdown", onPointerDown, true);
      } else {
        document.removeEventListener("keydown", onKeydown);
        document.removeEventListener("pointerdown", onPointerDown, true);
      }
    },
    { immediate: true },
  );
}
