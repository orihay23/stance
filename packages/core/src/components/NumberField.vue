<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from "vue";
import { cn } from "../utils/cn";
import { addStep, clampNumber, formatNumber, parseNumber } from "../utils/number";
import { useErrorSlot } from "../composables/useErrorSlot";

// The template has two root nodes (the field wrapper and the conditional
// error <p>), so Vue disables automatic attrs fallthrough — same reason
// Input/Textarea/DatePicker need this.
defineOptions({ inheritAttrs: false });

export interface NumberFieldProps {
  /** v-model. `undefined` means empty, not zero. */
  modelValue?: number;
  min?: number;
  max?: number;
  /** Amount the increment/decrement buttons and Arrow keys change the value by. @default 1 */
  step?: number;
  /**
   * BCP 47 tag driving display formatting and typed-input parsing.
   * @default "en-US"
   */
  locale?: string;
  /** Passed straight through to `Intl.NumberFormat` — e.g. `{ style: "currency", currency: "USD" }`. */
  formatOptions?: Intl.NumberFormatOptions;
  disabled?: boolean;
  required?: boolean;
  /** Marks the field invalid: set this for externally-known validation failures. Typed text that doesn't parse to a number sets the same visual/aria state internally. */
  invalid?: boolean;
  placeholder?: string;
  /** id for the underlying text input. Auto-generated via `useId()` if omitted — pass your own to pair with an external `<label for>`, same convention as Input.vue. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root wrapper. */
  class?: string;
}

const props = withDefaults(defineProps<NumberFieldProps>(), {
  step: 1,
  locale: "en-US",
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number | undefined];
}>();

const slots = defineSlots<{
  /** Error message shown — and wired to `aria-describedby` — when `invalid` (or a typed parse error) is true. */
  error?(): unknown;
}>();

const baseId = useId();
const inputId = computed(() => props.id ?? `${baseId}-input`);

const inputText = ref("");
const hasParseError = ref(false);

const { errorId, showError, describedBy } = useErrorSlot(
  () => inputId.value,
  () => props.invalid || hasParseError.value,
  () => Boolean(slots.error),
);

watch(
  () => props.modelValue,
  (value) => {
    inputText.value = value !== undefined ? formatNumber(value, props.locale, props.formatOptions) : "";
  },
  { immediate: true },
);

function commitTypedInput() {
  const text = inputText.value.trim();
  if (!text) {
    hasParseError.value = false;
    if (props.modelValue !== undefined) emit("update:modelValue", undefined);
    return;
  }
  const parsed = parseNumber(text, props.locale);
  if (parsed === undefined) {
    hasParseError.value = true;
    return;
  }
  hasParseError.value = false;
  emit("update:modelValue", clampNumber(parsed, props.min, props.max));
}

function onInput(event: Event) {
  inputText.value = (event.target as HTMLInputElement).value;
}

function onBlur() {
  commitTypedInput();
}

function setValue(next: number) {
  if (props.disabled) return;
  emit("update:modelValue", clampNumber(next, props.min, props.max));
}

function increment() {
  setValue(addStep(props.modelValue ?? 0, props.step));
}

function decrement() {
  setValue(addStep(props.modelValue ?? 0, -props.step));
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      increment();
      break;
    case "ArrowDown":
      event.preventDefault();
      decrement();
      break;
    case "Home":
      if (props.min !== undefined) {
        event.preventDefault();
        setValue(props.min);
      }
      break;
    case "End":
      if (props.max !== undefined) {
        event.preventDefault();
        setValue(props.max);
      }
      break;
    case "Enter":
      commitTypedInput();
      break;
  }
}

const isDecrementDisabled = computed(
  () => props.disabled || (props.min !== undefined && (props.modelValue ?? 0) <= props.min),
);
const isIncrementDisabled = computed(
  () => props.disabled || (props.max !== undefined && (props.modelValue ?? 0) >= props.max),
);

// Press-and-hold repeat: fires once immediately, waits, then repeats
// steadily until pointerup/pointerleave/unmount.
let holdTimeout: ReturnType<typeof setTimeout> | undefined;
let holdInterval: ReturnType<typeof setInterval> | undefined;

function stopHold() {
  clearTimeout(holdTimeout);
  clearInterval(holdInterval);
  holdTimeout = undefined;
  holdInterval = undefined;
}

function startHold(step: () => void) {
  step();
  holdTimeout = setTimeout(() => {
    holdInterval = setInterval(step, 80);
  }, 400);
}

onUnmounted(stopHold);

const rootClass = computed(() => cn("stance-number-field", props.class));
</script>

<template>
  <div :class="rootClass" :data-invalid="invalid || hasParseError || undefined" :data-disabled="disabled || undefined">
    <!-- tabindex="-1": the buttons are pointer/touch-only affordances, same
         as native <input type="number">'s own spinner arrows — keyboard
         users increment/decrement via ArrowUp/ArrowDown on the input
         itself, which the buttons don't add anything beyond. -->
    <button
      type="button"
      class="stance-number-field__button"
      aria-label="Decrease"
      tabindex="-1"
      :disabled="isDecrementDisabled"
      @pointerdown="startHold(decrement)"
      @pointerup="stopHold"
      @pointerleave="stopHold"
      @pointercancel="stopHold"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <input
      :id="inputId"
      v-bind="$attrs"
      class="stance-number-field__input"
      type="text"
      inputmode="decimal"
      role="spinbutton"
      :value="inputText"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required || undefined"
      :aria-valuenow="modelValue"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuetext="modelValue !== undefined ? formatNumber(modelValue, props.locale, props.formatOptions) : undefined"
      :aria-invalid="invalid || hasParseError || undefined"
      :aria-describedby="describedBy"
      autocomplete="off"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeydown"
    />

    <button
      type="button"
      class="stance-number-field__button"
      aria-label="Increase"
      tabindex="-1"
      :disabled="isIncrementDisabled"
      @pointerdown="startHold(increment)"
      @pointerup="stopHold"
      @pointerleave="stopHold"
      @pointercancel="stopHold"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>

  <p v-if="showError" :id="errorId" class="stance-number-field-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-number-field) {
  display: inline-flex;
  align-items: center;
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  transition:
    border-color var(--stance-motion-duration, 0.15s) ease,
    outline-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-number-field:focus-within) {
  border-color: var(--stance-color-ring);
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-number-field[data-invalid]) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-number-field[data-invalid]:focus-within) {
  border-color: var(--stance-color-destructive);
  outline-color: var(--stance-color-destructive);
}

:where(.stance-number-field[data-disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.stance-number-field__input) {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  border: none;
  background: none;
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-xs, 0.25rem);
  font: inherit;
  color: inherit;
  text-align: center;
}

:where(.stance-number-field__input:focus) {
  outline: none;
}

:where(.stance-number-field__input[aria-invalid="true"]) {
  color: var(--stance-color-destructive, currentColor);
}

:where(.stance-number-field-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}

:where(.stance-number-field__button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: var(--stance-color-muted-foreground);
  cursor: pointer;
}

:where(.stance-number-field__button svg) {
  width: 1em;
  height: 1em;
}

:where(.stance-number-field__button:hover:not(:disabled)) {
  background: var(--stance-color-muted);
}

:where(.stance-number-field__button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-number-field__button:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

:where(.stance-number-field__button:first-child) {
  border-start-start-radius: var(--stance-radius-md, 0.5rem);
  border-end-start-radius: var(--stance-radius-md, 0.5rem);
}

:where(.stance-number-field__button:last-child) {
  border-start-end-radius: var(--stance-radius-md, 0.5rem);
  border-end-end-radius: var(--stance-radius-md, 0.5rem);
}
</style>
