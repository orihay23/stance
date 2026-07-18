<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";
import { useRadioGroupContext } from "../composables/useRadioGroup";

defineOptions({ inheritAttrs: false });

export interface RadioProps {
  /** The value this radio represents within its `RadioGroup`. */
  value: string;
  /** Disables just this option, independent of the group's `disabled` state. */
  disabled?: boolean;
  /** id for the underlying native radio input. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root `<label>`. */
  class?: string;
}

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: false,
});

defineSlots<{
  /** This option's label text, rendered inside the native `<label>` so clicking it selects the radio. */
  default(): unknown;
}>();

const context = useRadioGroupContext();

const checked = computed(() => context?.modelValue.value === props.value);
const isDisabled = computed(() => props.disabled || Boolean(context?.disabled.value));
const groupInvalid = computed(() => Boolean(context?.invalid.value));

const generatedId = useId();
const radioId = computed(() => props.id ?? generatedId);

const rootClass = computed(() => cn("stance-radio", props.class));

function onChange() {
  if (!isDisabled.value) {
    context?.updateValue(props.value);
  }
}
</script>

<template>
  <label :class="rootClass" :data-disabled="isDisabled || undefined" :data-invalid="groupInvalid || undefined">
    <span class="stance-radio__control">
      <input
        v-bind="$attrs"
        type="radio"
        class="stance-radio__input"
        :id="radioId"
        :name="context?.name.value"
        :value="value"
        :checked="checked"
        :disabled="isDisabled"
        :required="context?.required.value || undefined"
        :aria-describedby="context?.describedBy.value"
        @change="onChange"
      />
      <span class="stance-radio__box" aria-hidden="true">
        <span class="stance-radio__dot" />
      </span>
    </span>
    <span class="stance-radio__label"><slot /></span>
  </label>
</template>

<style>
:where(.stance-radio) {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--stance-spacing-sm, 0.5rem);
  cursor: pointer;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  line-height: var(--stance-leading-normal, 1.5);
  color: var(--stance-color-foreground);
}

:where(.stance-radio[data-disabled]) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-radio__control) {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: var(--stance-control-box-size, 1.25rem);
  height: var(--stance-control-box-size, 1.25rem);
  /* Optically centers the box against the label's first line of text —
     see Checkbox.vue's matching comment for why this tracks 1lh instead of
     a fixed offset. */
  margin-top: max(0px, calc((1lh - var(--stance-control-box-size, 1.25rem)) / 2));
}

:where(.stance-radio__input) {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

:where(.stance-radio__box) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--stance-color-border);
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-background);
  transition:
    background-color var(--stance-motion-duration, 0.15s) ease,
    border-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-radio__input:focus-visible ~ .stance-radio__box) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-radio[data-invalid] .stance-radio__box) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-radio__input:checked ~ .stance-radio__box) {
  border-color: var(--stance-color-primary);
}

:where(.stance-radio[data-invalid] .stance-radio__input:checked ~ .stance-radio__box) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-radio__dot) {
  width: calc(var(--stance-control-box-size, 1.25rem) * 0.5);
  height: calc(var(--stance-control-box-size, 1.25rem) * 0.5);
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-primary);
  opacity: 0;
  transform: scale(0.5);
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}

:where(.stance-radio__input:checked ~ .stance-radio__box .stance-radio__dot) {
  opacity: 1;
  transform: scale(1);
}

:where(.stance-radio[data-invalid] .stance-radio__dot) {
  background: var(--stance-color-destructive);
}

:where(.stance-radio__label) {
  user-select: none;
}
</style>
