<script setup lang="ts">
import { computed, provide, ref, useSlots, watch } from "vue";
import { cn } from "../utils/cn";
import { SPLITTER_KEY } from "../composables/useSplitter";
import type { SplitterPaneConstraints } from "../composables/useSplitter";

export type SplitterOrientation = "horizontal" | "vertical";

export interface SplitterProps {
  /** @default "horizontal" */
  orientation?: SplitterOrientation;
  /** v-model: percentage size of each pane, in DOM order. Sums to 100. */
  modelValue?: number[];
  /** Resize increment (percentage points) applied by arrow keys on a divider. @default 5 */
  step?: number;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<SplitterProps>(), {
  orientation: "horizontal",
  step: 5,
});

const emit = defineEmits<{
  "update:modelValue": [value: number[]];
}>();

defineSlots<{
  /** Expects one `<SplitterPane>` per pane, in DOM order. */
  default(): unknown;
}>();

const paneIds = ref<string[]>([]);
const constraintsMap = new Map<string, SplitterPaneConstraints>();

function registerPane(id: string, constraints: SplitterPaneConstraints) {
  constraintsMap.set(id, constraints);
  if (!paneIds.value.includes(id)) paneIds.value = [...paneIds.value, id];
}

function unregisterPane(id: string) {
  constraintsMap.delete(id);
  paneIds.value = paneIds.value.filter((existing) => existing !== id);
}

// Sibling <SplitterPane>s mount sequentially, each running its own setup()
// and rendering its own template before the next sibling registers — so
// `paneIds.value.length` undercounts during an individual pane's own initial
// render (e.g. the first pane would briefly see a count of 1). Reading the
// slot's vnode list instead gives the true, final pane count immediately,
// so every pane's very first render already divides by the right total.
const slots = useSlots();
const paneCount = computed(() => slots.default?.().length ?? 0);

// Falls back to an even split whenever the incoming modelValue doesn't match
// the current pane count (initial mount, or a pane added/removed) — the same
// clamp-and-correct-via-emit pattern DataTable uses for an out-of-range page.
const sizes = computed<number[]>(() => {
  const count = paneCount.value;
  if (count === 0) return [];
  const given = props.modelValue;
  if (given && given.length === count) return given;
  const even = 100 / count;
  return Array.from({ length: count }, () => even);
});

watch(
  sizes,
  (value) => {
    if (!props.modelValue || props.modelValue.length !== value.length) {
      emit("update:modelValue", value);
    }
  },
  { immediate: true },
);

function resizePair(index: number, delta: number) {
  if (index <= 0 || index >= sizes.value.length) return;
  const a = sizes.value[index - 1]!;
  const b = sizes.value[index]!;
  const total = a + b;
  const constraintsA = constraintsMap.get(paneIds.value[index - 1]!);
  const constraintsB = constraintsMap.get(paneIds.value[index]!);
  const minA = constraintsA?.min.value ?? 0;
  const maxA = constraintsA?.max.value ?? 100;
  const minB = constraintsB?.min.value ?? 0;
  const maxB = constraintsB?.max.value ?? 100;

  const effectiveMin = Math.max(minA, total - maxB);
  const effectiveMax = Math.min(maxA, total - minB);

  const nextA = Math.min(Math.max(a + delta, effectiveMin), effectiveMax);
  const nextB = total - nextA;

  const next = [...sizes.value];
  next[index - 1] = nextA;
  next[index] = nextB;
  emit("update:modelValue", next);
}

const containerRef = ref<HTMLElement | null>(null);

provide(SPLITTER_KEY, {
  orientation: computed(() => props.orientation),
  step: computed(() => props.step),
  paneIds,
  sizes,
  registerPane,
  unregisterPane,
  resizePair,
  containerRef,
});

const rootClass = computed(() => cn("stance-splitter", props.class));
</script>

<template>
  <div ref="containerRef" :class="rootClass" :data-orientation="orientation">
    <slot />
  </div>
</template>

<style>
:where(.stance-splitter) {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:where(.stance-splitter[data-orientation="vertical"]) {
  flex-direction: column;
}
</style>
