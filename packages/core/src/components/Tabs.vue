<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { cn } from "../utils/cn";
import { TABS_KEY } from "../composables/useTabs";

export interface TabsProps {
  /**
   * v-model active tab value. Required (not defaulted) — unlike most of
   * this library's overlays, a Tabs with no active tab has no sensible
   * default: nothing would render in any panel, so the consumer must pick
   * an initial value (usually the first tab's).
   */
  modelValue: string;
  /** @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<TabsProps>(), {
  orientation: "horizontal",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

defineSlots<{
  /** Expects a `<TabList>` (containing `<Tab>`s) and one `<TabPanel>` per tab. */
  default(): unknown;
}>();

const tabsId = useId();
const active = computed(() => props.modelValue);

provide(TABS_KEY, {
  active,
  setActive: (value: string) => emit("update:modelValue", value),
  orientation: computed(() => props.orientation),
  tabsId,
});

const rootClass = computed(() => cn("stance-tabs", props.class));
</script>

<template>
  <div :class="rootClass" :data-orientation="orientation">
    <slot />
  </div>
</template>

<style>
:where(.stance-tabs) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-tabs[data-orientation="vertical"]) {
  flex-direction: row;
}
</style>
