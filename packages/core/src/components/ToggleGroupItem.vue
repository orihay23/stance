<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";
import { useToggleGroupContext } from "../composables/useToggleGroup";

defineOptions({ inheritAttrs: false });

export interface ToggleGroupItemProps {
  /** The value this segment represents within its `ToggleGroup`. */
  value: string;
  /** Disables just this option, independent of the group's `disabled` state. */
  disabled?: boolean;
  /** id for the underlying native radio input. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root `<label>`. */
  class?: string;
}

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
  disabled: false,
});

defineSlots<{
  /** This option's label text/icon, rendered inside the native `<label>`. */
  default(): unknown;
}>();

const context = useToggleGroupContext();

const checked = computed(() => context?.modelValue.value === props.value);
const isDisabled = computed(() => props.disabled || Boolean(context?.disabled.value));

const generatedId = useId();
const itemId = computed(() => props.id ?? generatedId);

const rootClass = computed(() => cn("stance-toggle-group-item", props.class));

function onChange() {
  if (!isDisabled.value) {
    context?.updateValue(props.value);
  }
}
</script>

<template>
  <label :class="rootClass" :data-disabled="isDisabled || undefined">
    <input
      v-bind="$attrs"
      type="radio"
      class="stance-toggle-group-item__input"
      :id="itemId"
      :name="context?.name.value"
      :value="value"
      :checked="checked"
      :disabled="isDisabled"
      :aria-describedby="context?.describedBy.value"
      @change="onChange"
    />
    <span class="stance-toggle-group-item__label"><slot /></span>
  </label>
</template>

<style>
:where(.stance-toggle-group-item) {
  position: relative;
  display: inline-flex;
}

:where(.stance-toggle-group-item__input) {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

:where(.stance-toggle-group-item__input:disabled) {
  cursor: not-allowed;
}

:where(.stance-toggle-group-item__label) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--stance-radius-md, 0.5rem) - 0.125rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-md, 0.75rem);
  font-size: var(--stance-text-sm, 0.875rem);
  font-weight: var(--stance-font-weight-medium, 500);
  color: var(--stance-color-foreground);
  user-select: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

:where(.stance-toggle-group-item[data-disabled] .stance-toggle-group-item__label) {
  opacity: 0.5;
}

:where(.stance-toggle-group-item__input:focus-visible ~ .stance-toggle-group-item__label) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-toggle-group-item__input:not(:disabled):hover ~ .stance-toggle-group-item__label) {
  background: var(--stance-color-muted);
}

:where(.stance-toggle-group-item__input:checked ~ .stance-toggle-group-item__label) {
  background: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
}

:where(.stance-toggle-group-item__input:checked:not(:disabled):hover ~ .stance-toggle-group-item__label) {
  background: var(--stance-color-primary-hover, var(--stance-color-primary));
}
</style>
