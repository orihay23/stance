<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { cn } from "../utils/cn";
import { TOGGLE_GROUP_KEY } from "../composables/useToggleGroup";

/**
 * Single-select only for now (mutually-exclusive options, visually a row of
 * connected segments instead of separate radio circles). Multi-select would
 * need independent aria-pressed toggle buttons and hand-rolled roving
 * tabindex instead of free native radio grouping — a large enough
 * architectural fork to defer to a follow-up.
 */
export interface ToggleGroupProps {
  /** v-model selected value. */
  modelValue?: string;
  /** Shared `name` for the native radio inputs. Auto-generated via `useId()` if omitted. */
  name?: string;
  disabled?: boolean;
  /**
   * Marks the whole group invalid: sets `aria-invalid`, and — when the
   * `error` slot has content — wires `aria-describedby` to it
   * automatically.
   */
  invalid?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<ToggleGroupProps>(), {
  disabled: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const slots = defineSlots<{
  /** The group's accessible name — rendered visibly and wired via aria-labelledby. */
  legend(): unknown;
  /** The group's `<ToggleGroupItem>` options. */
  default(): unknown;
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const baseId = useId();
const generatedName = useId();
const groupName = computed(() => props.name ?? generatedName);
const legendId = computed(() => `${baseId}-legend`);
const errorId = computed(() => `${baseId}-error`);
const showError = computed(() => props.invalid && Boolean(slots.error));
const describedBy = computed(() => (showError.value ? errorId.value : undefined));

const disabled = computed(() => props.disabled);
const invalid = computed(() => props.invalid);
const modelValue = computed(() => props.modelValue);

provide(TOGGLE_GROUP_KEY, {
  name: groupName,
  modelValue,
  disabled,
  invalid,
  describedBy,
  updateValue: (value: string) => emit("update:modelValue", value),
});

const rootClass = computed(() => cn("stance-toggle-group", props.class));
</script>

<template>
  <div
    :class="rootClass"
    role="radiogroup"
    :aria-labelledby="legendId"
    :aria-describedby="describedBy"
    :aria-invalid="invalid || undefined"
  >
    <div :id="legendId" class="stance-toggle-group__legend">
      <slot name="legend" />
    </div>
    <div class="stance-toggle-group__options">
      <slot />
    </div>
  </div>

  <p v-if="showError" :id="errorId" class="stance-toggle-group-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-toggle-group) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
}

:where(.stance-toggle-group__legend) {
  font-size: var(--stance-text-sm, 0.875rem);
  font-weight: var(--stance-font-weight-medium, 500);
  color: var(--stance-color-foreground);
}

:where(.stance-toggle-group__options) {
  display: inline-flex;
  width: fit-content;
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  padding: 0.125rem;
  gap: 0.125rem;
}

:where(.stance-toggle-group-error) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
