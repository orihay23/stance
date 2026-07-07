import type { Ref } from "vue";
import { onBeforeUnmount, watchEffect } from "vue";

/**
 * Registers a trigger button's DOM element onto its overlay context's
 * `triggerRef` (Popover/DropdownMenu), and clears it again on unmount if
 * this instance is still the registered one — shared so PopoverTrigger and
 * DropdownMenuTrigger don't each reimplement the identical
 * watchEffect+onBeforeUnmount pair. `triggerRef` is `undefined` when used
 * outside its provider (already warned about by `use*Context`); this is a
 * no-op in that case.
 */
export function useOverlayTriggerRef(
  triggerRef: Ref<HTMLElement | null | undefined> | undefined,
  buttonRef: Readonly<Ref<HTMLButtonElement | null>>,
): void {
  watchEffect(() => {
    if (triggerRef) triggerRef.value = buttonRef.value;
  });

  onBeforeUnmount(() => {
    if (triggerRef && triggerRef.value === buttonRef.value) triggerRef.value = null;
  });
}
