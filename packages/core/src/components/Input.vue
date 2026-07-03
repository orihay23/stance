<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";

defineOptions({ inheritAttrs: false });

export type InputType = "text" | "email" | "password" | "number";

export interface InputProps {
  /** Native `type` — drives browser semantics, keyboard, and built-in validation. @default "text" */
  type?: InputType;
  /** v-model value. Always the raw string from the native input, even for `type="number"`. */
  modelValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  /**
   * Marks the input invalid: sets `aria-invalid`, and — when the `error`
   * slot has content — wires `aria-describedby` to it automatically.
   */
  invalid?: boolean;
  /** id for the underlying `<input>`. Auto-generated via `useId()` if omitted — pass your own to pair with an external `<label for>`. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — the consumer's class always wins. */
  class?: string;
}

const props = withDefaults(defineProps<InputProps>(), {
  type: "text",
  disabled: false,
  readonly: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const slots = defineSlots<{
  /** Adornment rendered before the input (icon, currency symbol, etc). */
  prefix?(): unknown;
  /** Adornment rendered after the input (icon, unit, clear button, etc). */
  suffix?(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const errorId = computed(() => `${inputId.value}-error`);
const showError = computed(() => props.invalid && Boolean(slots.error));
const describedBy = computed(() => (showError.value ? errorId.value : undefined));

const wrapperClass = computed(() => cn("stance-input-wrapper", props.class));

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div
    :class="wrapperClass"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
  >
    <span v-if="$slots.prefix" class="stance-input-affix" data-slot="prefix">
      <slot name="prefix" />
    </span>

    <input
      :id="inputId"
      v-bind="$attrs"
      class="stance-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      @input="onInput"
    />

    <span v-if="$slots.suffix" class="stance-input-affix" data-slot="suffix">
      <slot name="suffix" />
    </span>
  </div>

  <p v-if="showError" :id="errorId" class="stance-input-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-input-wrapper) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  padding-inline: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  transition:
    border-color 0.15s ease,
    outline-color 0.15s ease;
}

:where(.stance-input-wrapper:focus-within) {
  border-color: var(--stance-color-ring);
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-input-wrapper[data-invalid]) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-input-wrapper[data-invalid]:focus-within) {
  border-color: var(--stance-color-destructive);
  outline-color: var(--stance-color-destructive);
}

:where(.stance-input-wrapper[data-disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.stance-input) {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding-block: var(--stance-spacing-sm, 0.5rem);
  font-family: inherit;
  font-size: var(--stance-text-base, 1rem);
  color: var(--stance-color-foreground);
}

:where(.stance-input::placeholder) {
  color: var(--stance-color-muted-foreground);
}

:where(.stance-input:disabled) {
  cursor: not-allowed;
}

:where(.stance-input-affix) {
  display: inline-flex;
  align-items: center;
  color: var(--stance-color-muted-foreground);
}

:where(.stance-input-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
