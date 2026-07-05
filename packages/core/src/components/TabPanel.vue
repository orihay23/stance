<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import { useTabsContext } from "../composables/useTabs";

export interface TabPanelProps {
  /** Matches the `value` of the `<Tab>` this panel belongs to. */
  value: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<TabPanelProps>();

defineSlots<{
  default(): unknown;
}>();

const context = useTabsContext("TabPanel");
const isSelected = computed(() => context?.active.value === props.value);

const rootClass = computed(() => cn("stance-tab-panel", props.class));
</script>

<template>
  <div
    v-show="isSelected"
    role="tabpanel"
    :id="`${context?.tabsId}-panel-${value}`"
    :aria-labelledby="`${context?.tabsId}-tab-${value}`"
    tabindex="0"
    :class="rootClass"
  >
    <slot />
  </div>
</template>

<style>
:where(.stance-tab-panel) {
  font-size: var(--stance-text-base, 1rem);
}

:where(.stance-tab-panel:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
  border-radius: var(--stance-radius-sm, 0.25rem);
}
</style>
