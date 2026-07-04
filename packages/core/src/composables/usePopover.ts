import type { Placement } from "@floating-ui/vue";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject } from "vue";

export interface PopoverContext {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
  triggerRef: Ref<HTMLElement | null | undefined>;
  triggerId: string;
  contentId: string;
  /** @default false — see Popover.vue's PopoverProps doc for what this changes. */
  modal: ComputedRef<boolean>;
  placement: ComputedRef<Placement>;
  offset: ComputedRef<number>;
  closeOnEscape: ComputedRef<boolean>;
  closeOnOutsideClick: ComputedRef<boolean>;
}

export const POPOVER_KEY: InjectionKey<PopoverContext> = Symbol("Popover");

/** Reads the enclosing Popover's context; warns in dev mode if there isn't one. */
export function usePopoverContext(componentName: string): PopoverContext | undefined {
  const context = inject(POPOVER_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <Popover>.`);
  }
  return context;
}
