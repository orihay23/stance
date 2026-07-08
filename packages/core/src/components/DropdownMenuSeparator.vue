<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import Separator from "./Separator.vue";

export interface DropdownMenuSeparatorProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<DropdownMenuSeparatorProps>();

const rootClass = computed(() => cn("stance-dropdown-menu__separator", props.class));
</script>

<template>
  <Separator :class="rootClass" />
</template>

<style>
:where(.stance-dropdown-menu__separator) {
  margin: var(--stance-spacing-xs, 0.25rem) 0;
}
</style>
