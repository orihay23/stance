<script setup lang="ts">
import { computed, onBeforeUnmount, useId, useTemplateRef, watch, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { useComboboxContext } from "../composables/useCombobox";

export interface ComboboxOptionProps {
  value: string;
  /** Display label — used for the debounced result-count announcement, and (single-select) to fill the input after selecting. Falls back to `value` when omitted. */
  label?: string;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<ComboboxOptionProps>(), {
  disabled: false,
});

defineSlots<{
  default(): unknown;
}>();

const context = useComboboxContext("ComboboxOption");
const optionId = `${context?.listboxId ?? "stance-combobox"}-option-${useId()}`;

watchEffect(() => {
  context?.registerOption({
    id: optionId,
    value: props.value,
    label: props.label ?? props.value,
    disabled: props.disabled,
  });
});
onBeforeUnmount(() => context?.unregisterOption(optionId));

const selected = computed(() => context?.isSelected(props.value) ?? false);
const active = computed(() => context?.activeDescendant.activeId.value === optionId);

const optionRef = useTemplateRef<HTMLElement>("optionRef");
watch(active, (isActive) => {
  if (isActive) optionRef.value?.scrollIntoView({ block: "nearest" });
});

function activate() {
  if (props.disabled) return;
  context?.selectValue(props.value, props.label ?? props.value);
}

function onMouseenter() {
  if (props.disabled) return;
  context?.activeDescendant.setActive(optionId);
}

// Without this, the highlight set by onMouseenter is sticky: it survives
// the mouse actually leaving the option (e.g. a keyboard user then moves
// focus elsewhere, or the popup re-renders under a stationary cursor) since
// nothing else clears it until another option is hovered or an arrow key
// is pressed. Only clear if this option is still the active one, so a
// keyboard nav that moved highlight elsewhere in the meantime isn't undone
// by a stale mouseleave.
function onMouseleave() {
  if (context?.activeDescendant.activeId.value === optionId) {
    context?.activeDescendant.setActive(null);
  }
}

const optionClass = computed(() => cn("stance-combobox__option", props.class));
</script>

<template>
  <div
    ref="optionRef"
    :id="optionId"
    role="option"
    :class="optionClass"
    :data-active="active || undefined"
    :aria-selected="selected"
    :aria-disabled="disabled || undefined"
    @mousedown.prevent
    @click="activate"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <slot />
  </div>
</template>

<style>
:where(.stance-combobox__option) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--stance-spacing-sm, 0.5rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  border-radius: var(--stance-radius-sm, 0.25rem);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-foreground);
  cursor: pointer;
  user-select: none;
}

:where(.stance-combobox__option[data-active]) {
  background: var(--stance-color-muted);
}

:where(.stance-combobox__option[aria-selected="true"])::after {
  content: "✓";
  color: var(--stance-color-primary);
}

:where(.stance-combobox__option[aria-disabled="true"]) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
