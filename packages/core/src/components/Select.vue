<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";
import { useErrorSlot } from "../composables/useErrorSlot";

defineOptions({ inheritAttrs: false });

export interface SelectProps {
  /** v-model selected value. */
  modelValue?: string;
  /** Shown as a disabled placeholder option, initially selected when `modelValue` is empty. */
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * Marks invalid: sets `aria-invalid`, and — when the `error` slot has
   * content — wires `aria-describedby` to it automatically.
   */
  invalid?: boolean;
  /** id for the underlying native `<select>`. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the wrapper. */
  class?: string;
}

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const slots = defineSlots<{
  /** Native `<option>`/`<optgroup>` elements, authored exactly like plain HTML. */
  default(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const generatedId = useId();
const selectId = computed(() => props.id ?? generatedId);
const { errorId, showError, describedBy } = useErrorSlot(
  () => selectId.value,
  () => props.invalid,
  () => Boolean(slots.error),
);

const wrapperClass = computed(() => cn("stance-select-wrapper", props.class));

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div :class="wrapperClass" :data-invalid="invalid || undefined" :data-disabled="disabled || undefined">
    <select
      v-bind="$attrs"
      :id="selectId"
      class="stance-select"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      @change="onChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>
    <svg class="stance-select__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>

  <p v-if="showError" :id="errorId" class="stance-select-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-select-wrapper) {
  position: relative;
  display: inline-flex;
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  transition:
    border-color var(--stance-motion-duration, 0.15s) ease,
    outline-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-select-wrapper:focus-within) {
  border-color: var(--stance-color-ring);
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-select-wrapper[data-invalid]) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-select-wrapper[data-invalid]:focus-within) {
  border-color: var(--stance-color-destructive);
  outline-color: var(--stance-color-destructive);
}

:where(.stance-select-wrapper[data-disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.stance-select) {
  appearance: none;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  margin: 0;
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-xl, 1.5rem) var(--stance-spacing-sm, 0.5rem)
    var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  color: var(--stance-color-foreground);
}

:where(.stance-select:disabled) {
  cursor: not-allowed;
}

:where(.stance-select__chevron) {
  position: absolute;
  top: 50%;
  right: var(--stance-spacing-sm, 0.5rem);
  transform: translateY(-50%);
  width: 1em;
  height: 1em;
  color: var(--stance-color-muted-foreground);
  pointer-events: none;
}

:where(.stance-select-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
