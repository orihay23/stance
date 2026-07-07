import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import type { Placement } from "@floating-ui/vue";
import type { ComputedRef, Ref } from "vue";
import { computed, unref } from "vue";

type FloatingReference = Parameters<typeof useFloating>[0];
type FloatingElementRef = Parameters<typeof useFloating>[1];

export interface UseFloatingOverlayOptions {
  open: Ref<boolean> | ComputedRef<boolean>;
  /** @default "bottom" */
  placement?: Ref<Placement> | ComputedRef<Placement> | Placement;
  /** Gap in pixels between the reference and floating element. @default 8 */
  offset?: Ref<number> | ComputedRef<number> | number;
}

/**
 * Shared floating-ui positioning for every teleported overlay (Popover,
 * Dropdown Menu, Tooltip, DatePicker's calendar): offset/flip/shift(padding:
 * 8) + autoUpdate, so each component doesn't re-declare the identical
 * middleware stack with just a different offset/placement default.
 */
export function useFloatingOverlay(
  reference: FloatingReference,
  floating: FloatingElementRef,
  options: UseFloatingOverlayOptions,
) {
  return useFloating(reference, floating, {
    open: options.open,
    placement: computed(() => unref(options.placement) ?? "bottom"),
    middleware: computed(() => [offset(unref(options.offset) ?? 8), flip(), shift({ padding: 8 })]),
    whileElementsMounted: autoUpdate,
  });
}
