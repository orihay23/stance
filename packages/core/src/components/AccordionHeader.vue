<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import { useAccordionContext, useAccordionItemContext } from "../composables/useAccordion";

export interface AccordionHeaderProps {
  /**
   * The heading level wrapping this item's trigger button — pick whatever
   * is correct for the accordion's position in the surrounding page
   * hierarchy (e.g. `2` if the accordion sits directly under an `<h1>`).
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the trigger button. */
  class?: string;
}

const props = withDefaults(defineProps<AccordionHeaderProps>(), {
  headingLevel: 3,
});

defineSlots<{
  default(): unknown;
}>();

const context = useAccordionContext("AccordionHeader");
const item = useAccordionItemContext("AccordionHeader");

const isOpen = computed(() => (item ? (context?.isOpen(item.value) ?? false) : false));
const disabled = computed(() => item?.disabled.value ?? false);
const headingTag = computed(() => `h${props.headingLevel}`);

function onClick() {
  if (!disabled.value && item) context?.toggle(item.value);
}

const triggerClass = computed(() => cn("stance-accordion-trigger", props.class));
</script>

<template>
  <component :is="headingTag" class="stance-accordion-header">
    <button
      type="button"
      :id="`${context?.accordionId}-header-${item?.value}`"
      :class="triggerClass"
      :aria-expanded="isOpen"
      :aria-controls="`${context?.accordionId}-panel-${item?.value}`"
      :disabled="disabled"
      :data-open="isOpen || undefined"
      @click="onClick"
    >
      <span class="stance-accordion-trigger__label"><slot /></span>
      <svg class="stance-accordion-trigger__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </component>
</template>

<style>
:where(.stance-accordion-header) {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
}

:where(.stance-accordion-trigger) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--stance-spacing-sm, 0.5rem);
  width: 100%;
  background: none;
  border: none;
  padding: var(--stance-spacing-md, 0.75rem) var(--stance-spacing-xs, 0.25rem);
  font: inherit;
  font-weight: var(--stance-font-weight-medium, 500);
  color: inherit;
  text-align: start;
  cursor: pointer;
}

:where(.stance-accordion-trigger:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-accordion-trigger:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-accordion-trigger__icon) {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

:where(.stance-accordion-trigger[data-open] .stance-accordion-trigger__icon) {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  :where(.stance-accordion-trigger__icon) {
    transition: none;
  }
}
</style>
