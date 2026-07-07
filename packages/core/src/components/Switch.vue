<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";
import { useErrorSlot } from "../composables/useErrorSlot";

defineOptions({ inheritAttrs: false });

export interface SwitchProps {
  /** v-model checked ("on") state. */
  modelValue?: boolean;
  disabled?: boolean;
  required?: boolean;
  /**
   * Marks invalid: sets `aria-invalid`, and — when the `error` slot has
   * content — wires `aria-describedby` to it automatically.
   */
  invalid?: boolean;
  /** id for the underlying native input. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root `<label>`. */
  class?: string;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const slots = defineSlots<{
  /** Label text, rendered inside the native `<label>` so clicking it toggles the switch. */
  default(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const generatedId = useId();
const switchId = computed(() => props.id ?? generatedId);
const { errorId, showError, describedBy } = useErrorSlot(
  () => switchId.value,
  () => props.invalid,
  () => Boolean(slots.error),
);

const rootClass = computed(() => cn("stance-switch", props.class));

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}
</script>

<template>
  <label :class="rootClass" :data-disabled="disabled || undefined" :data-invalid="invalid || undefined">
    <span class="stance-switch__control">
      <input
        v-bind="$attrs"
        type="checkbox"
        role="switch"
        class="stance-switch__input"
        :id="switchId"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-checked="modelValue ? 'true' : 'false'"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        @change="onChange"
      />
      <span class="stance-switch__track" aria-hidden="true">
        <span class="stance-switch__thumb" />
      </span>
    </span>
    <span class="stance-switch__label"><slot /></span>
  </label>

  <p v-if="showError" :id="errorId" class="stance-switch-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-switch) {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--stance-spacing-sm, 0.5rem);
  cursor: pointer;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  color: var(--stance-color-foreground);
}

:where(.stance-switch[data-disabled]) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-switch__control) {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: var(--stance-control-switch-width, 2.5rem);
  height: var(--stance-control-box-size, 1.25rem);
  margin-top: 0.125rem;
}

:where(.stance-switch__input) {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

:where(.stance-switch__track) {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--stance-color-border);
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-border);
  transition:
    background-color var(--stance-motion-duration, 0.15s) ease,
    border-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-switch__input:focus-visible ~ .stance-switch__track) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-switch[data-invalid] .stance-switch__track) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-switch__input:checked ~ .stance-switch__track) {
  background: var(--stance-color-primary);
  border-color: var(--stance-color-primary);
}

:where(.stance-switch[data-invalid] .stance-switch__input:checked ~ .stance-switch__track) {
  background: var(--stance-color-destructive);
  border-color: var(--stance-color-destructive);
}

:where(.stance-switch__thumb) {
  position: absolute;
  top: 0.0625rem;
  left: 0.0625rem;
  width: 1rem;
  height: 1rem;
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-background);
  box-shadow: var(--stance-shadow-md);
  transition: transform var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-switch__input:checked ~ .stance-switch__track .stance-switch__thumb) {
  transform: translateX(var(--stance-control-switch-thumb-travel, 1.25rem));
}

:where(.stance-switch__label) {
  user-select: none;
}

:where(.stance-switch-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
