<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { cn } from "../utils/cn";
import { RADIO_GROUP_KEY } from "../composables/useRadioGroup";
import { useErrorSlot } from "../composables/useErrorSlot";

export interface RadioGroupProps {
  /** v-model selected value. */
  modelValue?: string;
  /** Shared `name` for the native radio inputs. Auto-generated via `useId()` if omitted. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * Marks the whole group invalid: sets `aria-invalid` on the group, and —
   * when the `error` slot has content — wires `aria-describedby` to it
   * automatically.
   */
  invalid?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const slots = defineSlots<{
  /** The group's accessible name — rendered visibly and wired via aria-labelledby. */
  legend(): unknown;
  /** The group's `<Radio>` options. */
  default(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const baseId = useId();
const generatedName = useId();
const groupName = computed(() => props.name ?? generatedName);
const legendId = computed(() => `${baseId}-legend`);
const { errorId, showError, describedBy } = useErrorSlot(
  () => baseId,
  () => props.invalid,
  () => Boolean(slots.error),
);

const disabled = computed(() => props.disabled);
const required = computed(() => props.required);
const invalid = computed(() => props.invalid);
const modelValue = computed(() => props.modelValue);

provide(RADIO_GROUP_KEY, {
  name: groupName,
  modelValue,
  disabled,
  required,
  invalid,
  describedBy,
  updateValue: (value: string) => emit("update:modelValue", value),
});

const rootClass = computed(() => cn("stance-radio-group", props.class));
</script>

<template>
  <div
    :class="rootClass"
    role="radiogroup"
    :aria-labelledby="legendId"
    :aria-describedby="describedBy"
    :aria-invalid="invalid || undefined"
    :aria-required="required || undefined"
  >
    <div :id="legendId" class="stance-radio-group__legend">
      <slot name="legend" />
    </div>
    <div class="stance-radio-group__options">
      <slot />
    </div>
  </div>

  <p v-if="showError" :id="errorId" class="stance-radio-group-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-radio-group) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
}

:where(.stance-radio-group__legend) {
  font-size: var(--stance-text-sm, 0.875rem);
  font-weight: var(--stance-font-weight-medium, 500);
  color: var(--stance-color-foreground);
}

:where(.stance-radio-group__options) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
}

:where(.stance-radio-group-error) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
