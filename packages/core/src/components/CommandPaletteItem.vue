<script setup lang="ts">
import { computed, onBeforeUnmount, useId, useTemplateRef, watch, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { useCommandPaletteContext } from "../composables/useCommandPalette";

export interface CommandPaletteItemProps {
  /** Display label — used for the debounced result-count announcement. Unlike ComboboxOption's `value`/`label` pair, there's no separate `value`: a command palette item is an action (its own `@select` handler), not a value to persist. */
  label: string;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<CommandPaletteItemProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  select: [];
}>();

defineSlots<{
  default(): unknown;
}>();

const context = useCommandPaletteContext("CommandPaletteItem");
const itemId = `${context?.listboxId ?? "stance-command-palette"}-item-${useId()}`;

watchEffect(() => {
  context?.registerItem({ id: itemId, label: props.label, disabled: props.disabled });
});
onBeforeUnmount(() => context?.unregisterItem(itemId));

const active = computed(() => context?.activeDescendant.activeId.value === itemId);

const itemRef = useTemplateRef<HTMLElement>("itemRef");
watch(active, (isActive) => {
  if (isActive) itemRef.value?.scrollIntoView({ block: "nearest" });
});

function activate() {
  if (props.disabled) return;
  emit("select");
  context?.close();
}

function onMouseenter() {
  if (props.disabled) return;
  context?.activeDescendant.setActive(itemId);
}

// See ComboboxOption's identical handler: without this, a highlight set by
// onMouseenter is sticky — including the case where the palette opens
// directly under a stationary cursor (e.g. the trigger click's pointer
// position happens to land on the first row once the panel renders), which
// otherwise never clears until something else hovers or arrow-navigates.
function onMouseleave() {
  if (context?.activeDescendant.activeId.value === itemId) {
    context?.activeDescendant.setActive(null);
  }
}

const itemClass = computed(() => cn("stance-command-palette__item", props.class));
</script>

<template>
  <div
    ref="itemRef"
    :id="itemId"
    role="option"
    :class="itemClass"
    :data-active="active || undefined"
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
:where(.stance-command-palette__item) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-sm, 0.5rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  border-radius: var(--stance-radius-sm, 0.25rem);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-foreground);
  cursor: pointer;
  user-select: none;
}

:where(.stance-command-palette__item[data-active]) {
  background: var(--stance-color-muted);
}

:where(.stance-command-palette__item[aria-disabled="true"]) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
