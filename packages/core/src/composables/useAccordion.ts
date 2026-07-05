import type { ComputedRef, InjectionKey } from "vue";
import { inject } from "vue";

export interface AccordionContext {
  type: ComputedRef<"single" | "multiple">;
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  accordionId: string;
}

export const ACCORDION_KEY: InjectionKey<AccordionContext> = Symbol("Accordion");

/** Reads the enclosing Accordion's context; warns in dev mode if there isn't one. */
export function useAccordionContext(componentName: string): AccordionContext | undefined {
  const context = inject(ACCORDION_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within an <Accordion>.`);
  }
  return context;
}

export interface AccordionItemContext {
  value: string;
  disabled: ComputedRef<boolean>;
}

export const ACCORDION_ITEM_KEY: InjectionKey<AccordionItemContext> = Symbol("AccordionItem");

/** Reads the enclosing AccordionItem's context; warns in dev mode if there isn't one. */
export function useAccordionItemContext(componentName: string): AccordionItemContext | undefined {
  const context = inject(ACCORDION_ITEM_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within an <AccordionItem>.`);
  }
  return context;
}
