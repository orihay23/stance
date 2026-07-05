<script setup lang="ts">
import type { ButtonSize, ButtonVariant } from "./Button.vue";
import { computed, onBeforeUnmount, useTemplateRef, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { useDropdownMenuContext } from "../composables/useDropdownMenu";

export interface DropdownMenuTriggerProps {
  /** Visual style — reuses Button's variants. @default "secondary" */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), {
  variant: "secondary",
  size: "md",
  disabled: false,
});

defineSlots<{
  default(): unknown;
}>();

const context = useDropdownMenuContext("DropdownMenuTrigger");
const buttonRef = useTemplateRef<HTMLButtonElement>("buttonRef");

watchEffect(() => {
  if (context) context.triggerRef.value = buttonRef.value;
});

onBeforeUnmount(() => {
  if (context && context.triggerRef.value === buttonRef.value) context.triggerRef.value = null;
});

// A native <button> already fires "click" for a real pointer click AND for
// Enter/Space activation, so this alone covers those three inputs without
// re-implementing them — `event.detail === 0` is the standard way to tell
// a keyboard/programmatic activation apart from a real pointer click (whose
// detail is the click count, >= 1).
function onClick(event: MouseEvent) {
  if (!context) return;
  context.openedViaKeyboard.value = event.detail === 0;
  context.pendingFocus.value = "first";
  context.setOpen(!context.open.value);
}

// ArrowUp/ArrowDown have no native button-activation equivalent, so they're
// handled entirely separately — no overlap with onClick's cases above.
function onKeydown(event: KeyboardEvent) {
  if (!context || context.open.value) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    context.openedViaKeyboard.value = true;
    context.pendingFocus.value = "first";
    context.setOpen(true);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    context.openedViaKeyboard.value = true;
    context.pendingFocus.value = "last";
    context.setOpen(true);
  }
}

const rootClass = computed(() => cn("stance-button", props.class));
</script>

<template>
  <button
    ref="buttonRef"
    :id="context?.triggerId"
    type="button"
    :class="rootClass"
    :disabled="disabled"
    :data-variant="variant"
    :data-size="size"
    aria-haspopup="menu"
    :aria-expanded="context?.open.value ?? false"
    :aria-controls="context?.open.value ? context?.contentId : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot />
  </button>
</template>
