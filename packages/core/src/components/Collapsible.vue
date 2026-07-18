<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";

/**
 * APG Disclosure pattern — a single trigger button showing/hiding a single
 * region, nothing more: `aria-expanded` + `aria-controls` on the button,
 * no `role` and no `aria-labelledby` on the panel (unlike Accordion's
 * `AccordionContent`, which needs both since a full accordion widget is a
 * set of named region landmarks). No heading-level prop either — a lone
 * disclosure isn't a document-outline heading the way an accordion item's
 * trigger is. This is intentionally "a single Accordion item without the
 * heading/group semantics," so it stays small rather than growing into a
 * second compound Trigger/Content API.
 */
export interface CollapsibleProps {
  /** v-model — the open state, Collapsible's single primary piece of state. @default false */
  modelValue?: boolean;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<CollapsibleProps>(), {
  modelValue: false,
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

defineSlots<{
  /** The trigger button's label content. */
  trigger(): unknown;
  /** The collapsible region's content, shown/hidden based on `modelValue`. */
  default(): unknown;
}>();

const baseId = useId();
const contentId = `${baseId}-content`;

function toggle() {
  if (!props.disabled) emit("update:modelValue", !props.modelValue);
}

const rootClass = computed(() => cn("stance-collapsible", props.class));
</script>

<template>
  <div :class="rootClass">
    <button
      type="button"
      class="stance-collapsible-trigger"
      :aria-expanded="modelValue"
      :aria-controls="contentId"
      :disabled="disabled"
      :data-open="modelValue || undefined"
      @click="toggle"
    >
      <span class="stance-collapsible-trigger__label"><slot name="trigger" /></span>
      <svg class="stance-collapsible-trigger__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div v-show="modelValue" :id="contentId" class="stance-collapsible-content">
      <div class="stance-collapsible-content__inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
:where(.stance-collapsible-trigger) {
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

:where(.stance-collapsible-trigger:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-collapsible-trigger:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-collapsible-trigger__icon) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  transition: transform var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-collapsible-trigger[data-open] .stance-collapsible-trigger__icon) {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  :where(.stance-collapsible-trigger__icon) {
    transition: none;
  }
}

:where(.stance-collapsible-content) {
  font-size: var(--stance-text-base, 1rem);
}

:where(.stance-collapsible-content__inner) {
  padding: 0 var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-md, 0.75rem);
}
</style>
