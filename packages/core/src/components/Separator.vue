<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export interface SeparatorProps {
  /** @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /**
   * Purely visual dividers (no semantic grouping meaning — e.g. a rule
   * between two chunks of decorative page furniture) get `aria-hidden`
   * and no `role`, so assistive tech skips over them entirely. A
   * separator that actually delimits distinct sections of content
   * (the default) keeps `role="separator"`. @default false
   */
  decorative?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: "horizontal",
  decorative: false,
});

const rootClass = computed(() => cn("stance-separator", props.class));
</script>

<template>
  <div
    :class="rootClass"
    :data-orientation="orientation"
    :role="decorative ? undefined : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
    :aria-hidden="decorative || undefined"
  />
</template>

<style>
:where(.stance-separator) {
  flex-shrink: 0;
  background: var(--stance-color-border);
}

:where(.stance-separator[data-orientation="horizontal"]) {
  width: 100%;
  height: 1px;
}

:where(.stance-separator[data-orientation="vertical"]) {
  width: 1px;
  height: 100%;
  align-self: stretch;
}
</style>
