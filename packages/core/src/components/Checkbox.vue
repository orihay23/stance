<script setup lang="ts">
import { computed, useId, useTemplateRef, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { useErrorSlot } from "../composables/useErrorSlot";

defineOptions({ inheritAttrs: false });

export interface CheckboxProps {
  /** v-model checked state. */
  modelValue?: boolean;
  /**
   * Shows a visual + ARIA "mixed" state. Display-only — HTML checkboxes
   * have no indeterminate *value*, only an indeterminate *appearance* — so
   * this doesn't interact with `modelValue`; consumers driving tri-state
   * logic (e.g. "select all") manage that separately.
   */
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  /**
   * Marks invalid: sets `aria-invalid`, and — when the `error` slot has
   * content — wires `aria-describedby` to it automatically.
   */
  invalid?: boolean;
  /** id for the underlying native checkbox input. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root `<label>`. */
  class?: string;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const slots = defineSlots<{
  /** Label text, rendered inside the native `<label>` so clicking it toggles the checkbox. */
  default(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const generatedId = useId();
const checkboxId = computed(() => props.id ?? generatedId);
const { errorId, showError, describedBy } = useErrorSlot(
  () => checkboxId.value,
  () => props.invalid,
  () => Boolean(slots.error),
);

const rootClass = computed(() => cn("stance-checkbox", props.class));

// `indeterminate` has no HTML attribute — it's a JS-only IDL property on
// the element — so it has to be pushed onto the real DOM node imperatively.
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
watchEffect(() => {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate;
  }
});

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}
</script>

<template>
  <label :class="rootClass" :data-disabled="disabled || undefined" :data-invalid="invalid || undefined">
    <span class="stance-checkbox__control">
      <input
        ref="inputRef"
        v-bind="$attrs"
        type="checkbox"
        class="stance-checkbox__input"
        :id="checkboxId"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-checked="indeterminate ? 'mixed' : undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        @change="onChange"
      />
      <span class="stance-checkbox__box" aria-hidden="true">
        <svg class="stance-checkbox__check-icon" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg class="stance-checkbox__dash-icon" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
    </span>
    <span class="stance-checkbox__label"><slot /></span>
  </label>

  <p v-if="showError" :id="errorId" class="stance-checkbox-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-checkbox) {
  display: inline-flex;
  /* flex-start (not center) so the box aligns with the first line of a
     label that wraps onto multiple lines, instead of the vertical center
     of the whole wrapped block. */
  align-items: flex-start;
  gap: var(--stance-spacing-sm, 0.5rem);
  cursor: pointer;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  line-height: var(--stance-leading-normal, 1.5);
  color: var(--stance-color-foreground);
}

:where(.stance-checkbox[data-disabled]) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-checkbox__control) {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: var(--stance-control-box-size, 1.25rem);
  height: var(--stance-control-box-size, 1.25rem);
  /* Optically centers the box against the label's first line of text: half
     the first line's leading (line-height minus font's content area), so
     this tracks density instead of assuming one fixed font-size/line-height
     combination. */
  margin-top: max(0px, calc((1lh - var(--stance-control-box-size, 1.25rem)) / 2));
}

:where(.stance-checkbox__input) {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

:where(.stance-checkbox__box) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--stance-color-border);
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: var(--stance-color-background);
  color: var(--stance-color-primary-foreground);
  transition:
    background-color var(--stance-motion-duration, 0.15s) ease,
    border-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-checkbox__input:focus-visible ~ .stance-checkbox__box) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-checkbox[data-invalid] .stance-checkbox__box) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-checkbox__input:checked:not(:indeterminate) ~ .stance-checkbox__box),
:where(.stance-checkbox__input:indeterminate ~ .stance-checkbox__box) {
  background: var(--stance-color-primary);
  border-color: var(--stance-color-primary);
}

:where(.stance-checkbox[data-invalid] .stance-checkbox__input:checked:not(:indeterminate) ~ .stance-checkbox__box),
:where(.stance-checkbox[data-invalid] .stance-checkbox__input:indeterminate ~ .stance-checkbox__box) {
  background: var(--stance-color-destructive);
  border-color: var(--stance-color-destructive);
}

:where(.stance-checkbox__check-icon),
:where(.stance-checkbox__dash-icon) {
  position: absolute;
  width: calc(var(--stance-control-box-size, 1.25rem) * 0.7);
  height: calc(var(--stance-control-box-size, 1.25rem) * 0.7);
  opacity: 0;
  transition: opacity 0.1s ease;
}

:where(.stance-checkbox__input:checked:not(:indeterminate) ~ .stance-checkbox__box .stance-checkbox__check-icon) {
  opacity: 1;
}

:where(.stance-checkbox__input:indeterminate ~ .stance-checkbox__box .stance-checkbox__dash-icon) {
  opacity: 1;
}

:where(.stance-checkbox__label) {
  user-select: none;
}

:where(.stance-checkbox-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
