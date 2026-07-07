<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive";

export interface BadgeProps {
  /** @default "neutral" */
  variant?: BadgeVariant;
  /**
   * Screen-reader-only text describing what the badge means (e.g. "3 unread
   * notifications"). Required whenever the badge conveys information that
   * matters functionally (a count, a status) — color and shape alone can't
   * carry that to screen reader users. Omit only for purely decorative
   * badges where the surrounding content already says the same thing out
   * loud (e.g. a "New" label next to text that already reads "New").
   */
  label?: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: "neutral",
});

defineSlots<{
  default(): unknown;
}>();

const rootClass = computed(() => cn("stance-badge", props.class));
</script>

<template>
  <span :class="rootClass" :data-variant="variant">
    <span v-if="label" class="stance-visually-hidden">{{ label }}</span>
    <span :aria-hidden="label ? true : undefined">
      <slot />
    </span>
  </span>
</template>

<style>
:where(.stance-badge) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  padding: 0.125rem var(--stance-spacing-sm, 0.5rem);
  border-radius: var(--stance-radius-full, 9999px);
  font-size: var(--stance-text-xs, 0.75rem);
  font-weight: var(--stance-font-weight-medium, 500);
  line-height: var(--stance-leading-tight, 1.25);
  white-space: nowrap;
}

:where(.stance-badge[data-variant="neutral"]) {
  background: var(--stance-color-muted);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-badge[data-variant="primary"]) {
  background: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
}

:where(.stance-badge[data-variant="success"]) {
  background: var(--stance-color-success);
  color: var(--stance-color-success-foreground);
}

:where(.stance-badge[data-variant="warning"]) {
  background: var(--stance-color-warning);
  color: var(--stance-color-warning-foreground);
}

:where(.stance-badge[data-variant="destructive"]) {
  background: var(--stance-color-destructive);
  color: var(--stance-color-destructive-foreground);
}
</style>
