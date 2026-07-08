<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { addStep, clampNumber, formatNumber, fractionToValue } from "../utils/number";
import { useDragValue } from "../composables/useDragValue";

// Fallthrough attrs (e.g. a consumer's aria-label) need to land on the
// thumb — the actual role="slider" element — not the outer wrapper.
defineOptions({ inheritAttrs: false });

export interface SliderProps {
  /** v-model — the current value. Defaults to `min` when omitted. */
  modelValue?: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** @default 1 */
  step?: number;
  /** @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  /** BCP 47 tag driving `aria-valuetext`'s formatting. @default "en-US" */
  locale?: string;
  /** Passed straight through to `Intl.NumberFormat` for `aria-valuetext` — e.g. `{ style: "percent" }`. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: "horizontal",
  disabled: false,
  locale: "en-US",
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const trackRef = useTemplateRef<HTMLElement>("trackRef");
const thumbRef = useTemplateRef<HTMLElement>("thumbRef");

const currentValue = computed(() => props.modelValue ?? props.min);
const percent = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  return ((currentValue.value - props.min) / range) * 100;
});

function setValue(next: number) {
  if (props.disabled) return;
  emit("update:modelValue", clampNumber(next, props.min, props.max));
}

function valueFromPointerEvent(event: PointerEvent): number {
  if (!trackRef.value) return currentValue.value;
  const rect = trackRef.value.getBoundingClientRect();
  const size = props.orientation === "horizontal" ? rect.width : rect.height;
  if (size <= 0) return currentValue.value;

  // Vertical sliders put the max at the top, matching a volume-slider convention.
  const fraction =
    props.orientation === "horizontal" ? (event.clientX - rect.left) / size : (rect.bottom - event.clientY) / size;
  return fractionToValue(fraction, props.min, props.max, props.step);
}

const orientationRef = computed(() => props.orientation);

const { onPointerDown, onKeydown } = useDragValue({
  orientation: orientationRef,
  onDragStart(event) {
    setValue(valueFromPointerEvent(event));
    thumbRef.value?.focus();
  },
  onDragMove(event) {
    setValue(valueFromPointerEvent(event));
  },
  onStepPositive() {
    setValue(addStep(currentValue.value, props.step));
  },
  onStepNegative() {
    setValue(addStep(currentValue.value, -props.step));
  },
  onJumpToMin() {
    setValue(props.min);
  },
  onJumpToMax() {
    setValue(props.max);
  },
});

const valueText = computed(() =>
  props.formatOptions ? formatNumber(currentValue.value, props.locale, props.formatOptions) : undefined,
);

const rangeStyle = computed(() =>
  props.orientation === "horizontal" ? { width: `${percent.value}%` } : { height: `${percent.value}%` },
);
const thumbStyle = computed(() =>
  props.orientation === "horizontal" ? { left: `${percent.value}%` } : { bottom: `${percent.value}%` },
);

const rootClass = computed(() => cn("stance-slider", props.class));
</script>

<template>
  <div :class="rootClass" :data-orientation="orientation" :data-disabled="disabled || undefined">
    <div ref="trackRef" class="stance-slider__track" @pointerdown="onPointerDown">
      <div class="stance-slider__range" :style="rangeStyle" />
      <div
        ref="thumbRef"
        v-bind="$attrs"
        class="stance-slider__thumb"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-valuenow="currentValue"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuetext="valueText"
        :aria-orientation="orientation"
        :aria-disabled="disabled || undefined"
        :style="thumbStyle"
        @keydown="onKeydown"
      />
    </div>
  </div>
</template>

<style>
:where(.stance-slider) {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--stance-spacing-sm, 0.5rem) 0;
  touch-action: none;
}

:where(.stance-slider[data-orientation="vertical"]) {
  flex-direction: column;
  width: auto;
  height: 12rem;
  padding: 0 var(--stance-spacing-sm, 0.5rem);
}

:where(.stance-slider__track) {
  position: relative;
  flex: 1 1 auto;
  height: 4px;
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-muted);
  cursor: pointer;
}

:where(.stance-slider[data-orientation="vertical"] .stance-slider__track) {
  flex: 1 1 auto;
  width: 4px;
  height: auto;
}

:where(.stance-slider__range) {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  bottom: 0;
  background: var(--stance-color-primary);
  border-radius: inherit;
}

:where(.stance-slider[data-orientation="vertical"] .stance-slider__range) {
  inset-inline: 0;
  top: auto;
  bottom: 0;
}

:where(.stance-slider__thumb) {
  position: absolute;
  top: 50%;
  left: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--stance-color-background);
  border: 2px solid var(--stance-color-primary);
  transform: translate(-50%, -50%);
  cursor: grab;
}

:where(.stance-slider[data-orientation="vertical"] .stance-slider__thumb) {
  top: auto;
  left: 50%;
  bottom: 0;
  transform: translate(-50%, 50%);
}

:where(.stance-slider__thumb:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-slider[data-disabled]) {
  opacity: 0.5;
}

:where(.stance-slider[data-disabled] .stance-slider__track) {
  cursor: not-allowed;
}

:where(.stance-slider[data-disabled] .stance-slider__thumb) {
  cursor: not-allowed;
}
</style>
