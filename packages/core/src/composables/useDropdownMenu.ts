import type { Placement, VirtualElement } from "@floating-ui/vue";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject } from "vue";

export interface DropdownMenuContext {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
  triggerRef: Ref<HTMLElement | null | undefined>;
  triggerId: string;
  contentId: string;
  placement: ComputedRef<Placement>;
  offset: ComputedRef<number>;
  /** Whether the menu is currently open because of a keyboard activation (vs. a mouse click) — drives whether Tab is trapped inside it. */
  openedViaKeyboard: Ref<boolean>;
  /** Which item should receive focus the next time the menu opens. */
  pendingFocus: Ref<"first" | "last">;
  /**
   * Set by `<DropdownMenuContextTrigger>` to anchor the menu at pointer
   * coordinates instead of `triggerRef`'s DOM element — a separate field
   * rather than widening `triggerRef`'s type, so `useOverlayTriggerRef`
   * (shared with Popover/Combobox) stays untouched. `DropdownMenuContent`
   * prefers this over `triggerRef` when both are set.
   */
  virtualReference: Ref<VirtualElement | null>;
}

export const DROPDOWN_MENU_KEY: InjectionKey<DropdownMenuContext> = Symbol("DropdownMenu");

/** Reads the enclosing DropdownMenu's context; warns in dev mode if there isn't one. */
export function useDropdownMenuContext(componentName: string): DropdownMenuContext | undefined {
  const context = inject(DROPDOWN_MENU_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <DropdownMenu>.`);
  }
  return context;
}
