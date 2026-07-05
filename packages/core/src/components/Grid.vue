<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export type GridResponsiveMode = "container" | "viewport";

export type GridGap = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Column count per breakpoint — the same shape for both `responsiveMode`s
 * (only which kind of query reads them differs), so switching modes never
 * requires rewriting this config. `sm`/`md`/`lg`/`xl` match Tailwind's
 * default breakpoints (640/768/1024/1280px); each is a "min-width and up"
 * override of the previous one, `base` being the smallest/mobile-first value.
 */
export interface GridColumns {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface GridProps {
  /**
   * `"container"`: column count responds to the Grid's own rendered width
   * via container queries — correct even when the Grid isn't as wide as the
   * viewport (e.g. next to a sidebar).
   *
   * `"viewport"`: column count responds to viewport width via media
   * queries, using Tailwind's default breakpoint values.
   * @default "container"
   */
  responsiveMode?: GridResponsiveMode;
  /** @default `{ base: 1 }` */
  columns?: GridColumns;
  /** Gap between cells, from the theme's spacing scale. @default "md" */
  gap?: GridGap;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the outer container. */
  class?: string;
}

const props = withDefaults(defineProps<GridProps>(), {
  responsiveMode: "container",
  columns: () => ({ base: 1 }),
  gap: "md",
});

defineSlots<{
  default(): unknown;
}>();

const BREAKPOINTS = ["sm", "md", "lg", "xl"] as const;

// Custom properties, not inline pixel/track values — the actual per-
// breakpoint CSS (in <style> below) reads these via var() with fallback
// chains, so an unset breakpoint here correctly falls through to the next
// smaller one that *is* set, all through the cascade (no JS resolution).
const columnVars = computed(() => {
  const vars: Record<string, string> = {
    "--stance-grid-cols-base": String(props.columns.base ?? 1),
  };
  for (const bp of BREAKPOINTS) {
    const value = props.columns[bp];
    if (value !== undefined) vars[`--stance-grid-cols-${bp}`] = String(value);
  }
  return vars;
});

const rootClass = computed(() => cn("stance-grid-container", props.class));
</script>

<template>
  <!--
    Two elements, not one: a size container can't respond to a container
    query it establishes itself, so the container-query context lives on
    this outer element while the actual `display: grid` (and its
    per-breakpoint column overrides) lives on the inner one.
  -->
  <div :class="rootClass" :style="columnVars">
    <div class="stance-grid" :data-responsive-mode="responsiveMode" :data-gap="gap">
      <slot />
    </div>
  </div>
</template>

<style>
:where(.stance-grid-container) {
  container-type: inline-size;
  container-name: stance-grid;
  width: 100%;
}

:where(.stance-grid) {
  display: grid;
  grid-template-columns: repeat(var(--stance-grid-cols-base, 1), minmax(0, 1fr));
}

:where(.stance-grid[data-gap="xs"]) {
  gap: var(--stance-spacing-xs, 0.25rem);
}
:where(.stance-grid[data-gap="sm"]) {
  gap: var(--stance-spacing-sm, 0.5rem);
}
:where(.stance-grid[data-gap="md"]) {
  gap: var(--stance-spacing-md, 0.75rem);
}
:where(.stance-grid[data-gap="lg"]) {
  gap: var(--stance-spacing-lg, 1rem);
}
:where(.stance-grid[data-gap="xl"]) {
  gap: var(--stance-spacing-xl, 1.5rem);
}

/*
 * Viewport mode: standard min-width media queries. All four still stack
 * mobile-first (each rule stays active at every larger width too), so at
 * e.g. 1280px+ the sm/md/lg/xl rules are all "in effect" — with :where()
 * keeping every rule at specificity 0, source order alone decides, and xl
 * (written last) wins. Each rule's var() fallback chain resolves to the
 * nearest smaller breakpoint that was actually configured, so a gap in the
 * `columns` config (e.g. only base+lg given) still does the right thing.
 */
@media (min-width: 640px) {
  :where(.stance-grid[data-responsive-mode="viewport"]) {
    grid-template-columns: repeat(var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1)), minmax(0, 1fr));
  }
}
@media (min-width: 768px) {
  :where(.stance-grid[data-responsive-mode="viewport"]) {
    grid-template-columns: repeat(
      var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1))),
      minmax(0, 1fr)
    );
  }
}
@media (min-width: 1024px) {
  :where(.stance-grid[data-responsive-mode="viewport"]) {
    grid-template-columns: repeat(
      var(--stance-grid-cols-lg, var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1)))),
      minmax(0, 1fr)
    );
  }
}
@media (min-width: 1280px) {
  :where(.stance-grid[data-responsive-mode="viewport"]) {
    grid-template-columns: repeat(
      var(
        --stance-grid-cols-xl,
        var(--stance-grid-cols-lg, var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1))))
      ),
      minmax(0, 1fr)
    );
  }
}

/* Container mode: identical thresholds and fallback chains, queried
   against stance-grid-container's own width instead of the viewport. */
@container stance-grid (min-width: 640px) {
  :where(.stance-grid[data-responsive-mode="container"]) {
    grid-template-columns: repeat(var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1)), minmax(0, 1fr));
  }
}
@container stance-grid (min-width: 768px) {
  :where(.stance-grid[data-responsive-mode="container"]) {
    grid-template-columns: repeat(
      var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1))),
      minmax(0, 1fr)
    );
  }
}
@container stance-grid (min-width: 1024px) {
  :where(.stance-grid[data-responsive-mode="container"]) {
    grid-template-columns: repeat(
      var(--stance-grid-cols-lg, var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1)))),
      minmax(0, 1fr)
    );
  }
}
@container stance-grid (min-width: 1280px) {
  :where(.stance-grid[data-responsive-mode="container"]) {
    grid-template-columns: repeat(
      var(
        --stance-grid-cols-xl,
        var(--stance-grid-cols-lg, var(--stance-grid-cols-md, var(--stance-grid-cols-sm, var(--stance-grid-cols-base, 1))))
      ),
      minmax(0, 1fr)
    );
  }
}
</style>
