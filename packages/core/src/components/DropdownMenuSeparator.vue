<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export interface DropdownMenuSeparatorProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<DropdownMenuSeparatorProps>();

const rootClass = computed(() => cn("stance-dropdown-menu__separator", props.class));
</script>

<template>
  <div role="separator" aria-orientation="horizontal" :class="rootClass" />
</template>

<style>
:where(.stance-dropdown-menu__separator) {
  height: 1px;
  margin: var(--stance-spacing-xs, 0.25rem) 0;
  background: var(--stance-color-border);
}
</style>
