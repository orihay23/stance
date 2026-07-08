import type { Ref } from "vue";
import { onBeforeUnmount, watchEffect } from "vue";

/**
 * Registers a trigger element's DOM node onto its overlay context's
 * `triggerRef` (Popover/DropdownMenu/Combobox), and clears it again on
 * unmount if this instance is still the registered one — shared so
 * PopoverTrigger, DropdownMenuTrigger, and ComboboxInput don't each
 * reimplement the identical watchEffect+onBeforeUnmount pair. Typed as a
 * plain `HTMLElement` rather than `HTMLButtonElement` since there's no
 * button-specific behavior here — ComboboxInput registers an `<input>`.
 * `triggerRef` is `undefined` when used outside its provider (already
 * warned about by `use*Context`); this is a no-op in that case.
 */
export function useOverlayTriggerRef(
  triggerRef: Ref<HTMLElement | null | undefined> | undefined,
  elementRef: Readonly<Ref<HTMLElement | null>>,
): void {
  watchEffect(() => {
    if (triggerRef) triggerRef.value = elementRef.value;
  });

  onBeforeUnmount(() => {
    if (triggerRef && triggerRef.value === elementRef.value) triggerRef.value = null;
  });
}
