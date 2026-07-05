<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import { useAccordionContext, useAccordionItemContext } from "../composables/useAccordion";

export interface AccordionContentProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<AccordionContentProps>();

defineSlots<{
  default(): unknown;
}>();

const context = useAccordionContext("AccordionContent");
const item = useAccordionItemContext("AccordionContent");

const isOpen = computed(() => (item ? (context?.isOpen(item.value) ?? false) : false));

const rootClass = computed(() => cn("stance-accordion-content", props.class));
</script>

<template>
  <div
    v-show="isOpen"
    :id="`${context?.accordionId}-panel-${item?.value}`"
    :aria-labelledby="`${context?.accordionId}-header-${item?.value}`"
    :class="rootClass"
  >
    <div class="stance-accordion-content__inner">
      <slot />
    </div>
  </div>
</template>

<style>
:where(.stance-accordion-content) {
  font-size: var(--stance-text-base, 1rem);
}

:where(.stance-accordion-content__inner) {
  padding: 0 var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-md, 0.75rem);
}
</style>
