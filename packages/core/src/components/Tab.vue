<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import { useTabsContext } from "../composables/useTabs";

export interface TabProps {
  value: string;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<TabProps>(), {
  disabled: false,
});

defineSlots<{
  default(): unknown;
}>();

const context = useTabsContext("Tab");
const isSelected = computed(() => context?.active.value === props.value);

function onClick() {
  if (!props.disabled) context?.setActive(props.value);
}

const rootClass = computed(() => cn("stance-tab", props.class));
</script>

<template>
  <button
    type="button"
    role="tab"
    :id="`${context?.tabsId}-tab-${value}`"
    :data-value="value"
    :aria-selected="isSelected"
    :aria-controls="`${context?.tabsId}-panel-${value}`"
    :tabindex="isSelected ? 0 : -1"
    :disabled="disabled"
    :data-selected="isSelected || undefined"
    :class="rootClass"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<style>
:where(.stance-tab) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  font: inherit;
  font-weight: var(--stance-font-weight-medium, 500);
  color: var(--stance-color-muted-foreground);
  cursor: pointer;
}

:where(.stance-tab:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-tab:not(:disabled):hover) {
  color: var(--stance-color-foreground);
}

:where(.stance-tab:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-tab[data-selected]) {
  color: var(--stance-color-primary);
  border-bottom-color: var(--stance-color-primary);
}

:where([aria-orientation="vertical"] .stance-tab) {
  border-bottom: none;
  border-inline-end: 2px solid transparent;
  margin-bottom: 0;
  margin-inline-end: -1px;
}

:where([aria-orientation="vertical"] .stance-tab[data-selected]) {
  border-inline-end-color: var(--stance-color-primary);
}
</style>
