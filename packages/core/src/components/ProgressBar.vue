<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export interface ProgressBarProps {
  /** Current value. Ignored when `indeterminate`. @default 0 */
  value?: number;
  /** @default 100 */
  max?: number;
  /**
   * Unknown duration/completion — omits `aria-valuenow` per the
   * `role="progressbar"` spec rather than reporting a fake value.
   * @default false
   */
  indeterminate?: boolean;
  /** Accessible name, when this progress bar isn't already labeled by surrounding content. */
  label?: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  value: 0,
  max: 100,
  indeterminate: false,
});

defineSlots<{
  /** Optional custom content (e.g. a "42%" label) — scoped with the clamped value/max/percent. */
  default?(scope: { value: number; max: number; percent: number }): unknown;
}>();

const clampedValue = computed(() => Math.min(Math.max(props.value, 0), props.max));
const percent = computed(() => (props.max > 0 ? (clampedValue.value / props.max) * 100 : 0));

const rootClass = computed(() => cn("stance-progress", props.class));
</script>

<template>
  <div
    :class="rootClass"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
    :data-indeterminate="indeterminate || undefined"
  >
    <div class="stance-progress__track">
      <div
        class="stance-progress__fill"
        :style="indeterminate ? undefined : { width: `${percent}%` }"
      />
    </div>
    <slot :value="clampedValue" :max="props.max" :percent="percent" />
  </div>
</template>

<style>
:where(.stance-progress) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-xs, 0.25rem);
  width: 100%;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
}

:where(.stance-progress__track) {
  position: relative;
  width: 100%;
  height: var(--stance-control-progress-bar-track-height, 0.5rem);
  overflow: hidden;
  background: var(--stance-color-muted);
  border-radius: var(--stance-radius-full, 9999px);
}

:where(.stance-progress__fill) {
  height: 100%;
  background: var(--stance-color-primary);
  border-radius: var(--stance-radius-full, 9999px);
  transition: width 0.2s ease;
}

:where(.stance-progress[data-indeterminate] .stance-progress__fill) {
  position: absolute;
  width: 40%;
  animation: stance-progress-indeterminate 1.2s ease-in-out infinite;
}

@keyframes stance-progress-indeterminate {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  :where(.stance-progress[data-indeterminate] .stance-progress__fill) {
    animation-duration: 2.4s;
  }
}
</style>
