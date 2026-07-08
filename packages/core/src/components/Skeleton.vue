<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

/**
 * Purely presentational loading placeholder — always `aria-hidden`, no
 * role, nothing announced to assistive tech. This is a deliberate design
 * decision, not a gap: a screen reader user doesn't benefit from being
 * told "loading, loading, loading" once per skeleton block on the page.
 * The consumer is responsible for announcing the loading state itself —
 * typically once, at the container level (e.g. `aria-busy="true"` plus a
 * single `useLiveAnnouncer().announce("Loading…")` call), not per
 * Skeleton instance.
 */
export interface SkeletonProps {
  /** @default "pulse" */
  variant?: "pulse" | "shimmer";
  /** Extra classes merged with internal classes via `tailwind-merge` — size and shape (width/height/rounded-full for an avatar, etc.) are entirely up to the consumer's classes. */
  class?: string;
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: "pulse",
});

const rootClass = computed(() => cn("stance-skeleton", props.class));
</script>

<template>
  <div :class="rootClass" :data-variant="variant" aria-hidden="true" />
</template>

<style>
:where(.stance-skeleton) {
  display: block;
  position: relative;
  overflow: hidden;
  border-radius: var(--stance-radius-md, 0.5rem);
  background: var(--stance-color-muted);
}

@media (prefers-reduced-motion: no-preference) {
  :where(.stance-skeleton[data-variant="pulse"]) {
    animation: stance-skeleton-pulse 1.5s ease-in-out infinite;
  }

  :where(.stance-skeleton[data-variant="shimmer"])::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in oklch, var(--stance-color-foreground) 8%, transparent),
      transparent
    );
    animation: stance-skeleton-shimmer 1.5s ease-in-out infinite;
  }
}

@keyframes stance-skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes stance-skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
