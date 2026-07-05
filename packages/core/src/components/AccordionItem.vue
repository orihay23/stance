<script setup lang="ts">
import { computed, provide } from "vue";
import { cn } from "../utils/cn";
import { ACCORDION_ITEM_KEY } from "../composables/useAccordion";

export interface AccordionItemProps {
  /** Unique key identifying this item within the Accordion. */
  value: string;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<AccordionItemProps>(), {
  disabled: false,
});

defineSlots<{
  /** Expects an `<AccordionHeader>` and an `<AccordionContent>`. */
  default(): unknown;
}>();

provide(ACCORDION_ITEM_KEY, {
  value: props.value,
  disabled: computed(() => props.disabled),
});

const rootClass = computed(() => cn("stance-accordion-item", props.class));
</script>

<template>
  <div :class="rootClass">
    <slot />
  </div>
</template>

<style>
:where(.stance-accordion-item) {
  border-bottom: 1px solid var(--stance-color-border);
}

:where(.stance-accordion-item:first-child) {
  border-top: 1px solid var(--stance-color-border);
}
</style>
