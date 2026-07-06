<script setup lang="ts">
import { computed, onBeforeUnmount, useId } from "vue";
import { cn } from "../utils/cn";
import { useSplitterContext } from "../composables/useSplitter";

export interface SplitterPaneProps {
  /** Minimum size, as a percentage of the splitter's total. @default 0 */
  min?: number;
  /** Maximum size, as a percentage of the splitter's total. @default 100 */
  max?: number;
  /** Accessible label for the divider immediately before this pane (not rendered for the first pane). @default "Resize" */
  dividerLabel?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the pane's own container. */
  class?: string;
}

const props = withDefaults(defineProps<SplitterPaneProps>(), {
  min: 0,
  max: 100,
  dividerLabel: "Resize",
});

defineSlots<{ default(): unknown }>();

const context = useSplitterContext("SplitterPane");
const paneId = useId();

const minRef = computed(() => props.min);
const maxRef = computed(() => props.max);

context?.registerPane(paneId, { min: minRef, max: maxRef });
onBeforeUnmount(() => context?.unregisterPane(paneId));

const index = computed(() => context?.paneIds.value.indexOf(paneId) ?? 0);
const isFirst = computed(() => index.value === 0);
const size = computed(() => context?.sizes.value[index.value] ?? 0);
const orientation = computed(() => context?.orientation.value ?? "horizontal");

let lastPointerPos = 0;

function onDividerPointerDown(event: PointerEvent) {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  lastPointerPos = orientation.value === "horizontal" ? event.clientX : event.clientY;
  window.addEventListener("pointermove", onDividerPointerMove);
  window.addEventListener("pointerup", onDividerPointerUp);
}

function onDividerPointerMove(event: PointerEvent) {
  if (!context?.containerRef.value) return;
  const rect = context.containerRef.value.getBoundingClientRect();
  const totalPx = orientation.value === "horizontal" ? rect.width : rect.height;
  if (totalPx <= 0) return;
  const currentPos = orientation.value === "horizontal" ? event.clientX : event.clientY;
  const deltaPx = currentPos - lastPointerPos;
  lastPointerPos = currentPos;
  context.resizePair(index.value, (deltaPx / totalPx) * 100);
}

function onDividerPointerUp() {
  window.removeEventListener("pointermove", onDividerPointerMove);
  window.removeEventListener("pointerup", onDividerPointerUp);
}

function onDividerKeydown(event: KeyboardEvent) {
  if (!context) return;
  const step = context.step.value;
  const horizontal = orientation.value === "horizontal";
  const growKey = horizontal ? "ArrowRight" : "ArrowDown";
  const shrinkKey = horizontal ? "ArrowLeft" : "ArrowUp";
  if (event.key === growKey) {
    event.preventDefault();
    context.resizePair(index.value, step);
  } else if (event.key === shrinkKey) {
    event.preventDefault();
    context.resizePair(index.value, -step);
  } else if (event.key === "Home") {
    event.preventDefault();
    context.resizePair(index.value, Number.NEGATIVE_INFINITY);
  } else if (event.key === "End") {
    event.preventDefault();
    context.resizePair(index.value, Number.POSITIVE_INFINITY);
  }
}

const dividerValueNow = computed(() => Math.round(context?.sizes.value[index.value - 1] ?? 0));
const paneClass = computed(() => cn("stance-splitter-pane", props.class));
</script>

<template>
  <div
    v-if="!isFirst"
    class="stance-splitter__divider"
    role="separator"
    :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
    :aria-label="dividerLabel"
    :aria-valuenow="dividerValueNow"
    :aria-valuemin="0"
    :aria-valuemax="100"
    tabindex="0"
    @pointerdown="onDividerPointerDown"
    @keydown="onDividerKeydown"
  />
  <div :class="paneClass" :style="{ flex: `0 0 ${size}%` }">
    <slot />
  </div>
</template>

<style>
:where(.stance-splitter-pane) {
  overflow: auto;
  min-width: 0;
  min-height: 0;
}

/*
 * The hit area is a full spacing-sm-wide strip (comfortable for pointer/touch
 * drag), but only a thin centered line is visually drawn by default so
 * adjacent panes don't lose noticeable space to it — the line thickens to
 * fill the whole strip on hover/focus as a resize affordance.
 */
:where(.stance-splitter__divider) {
  flex: 0 0 auto;
  width: var(--stance-spacing-sm, 0.5rem);
  cursor: col-resize;
  position: relative;
  touch-action: none;
}
:where(.stance-splitter__divider)::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2px;
  height: 100%;
  background: var(--stance-color-border);
}
:where(.stance-splitter__divider:hover)::before,
:where(.stance-splitter__divider:focus-visible)::before {
  width: 100%;
  background: var(--stance-color-primary);
}
:where(.stance-splitter__divider:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-splitter[data-orientation="vertical"] .stance-splitter__divider) {
  width: auto;
  height: var(--stance-spacing-sm, 0.5rem);
  cursor: row-resize;
}
:where(.stance-splitter[data-orientation="vertical"] .stance-splitter__divider)::before {
  width: 100%;
  height: 2px;
}
:where(.stance-splitter[data-orientation="vertical"] .stance-splitter__divider:hover)::before,
:where(.stance-splitter[data-orientation="vertical"] .stance-splitter__divider:focus-visible)::before {
  height: 100%;
}
</style>
