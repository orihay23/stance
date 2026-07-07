<script setup lang="ts">
import type { ButtonSize, ButtonVariant } from "./Button.vue";
import { computed, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { usePopoverContext } from "../composables/usePopover";
import { useOverlayTriggerRef } from "../composables/useOverlayTriggerRef";

export interface PopoverTriggerProps {
  /** Visual style — reuses Button's variants so the trigger looks native to the rest of the library. @default "secondary" */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
  variant: "secondary",
  size: "md",
  disabled: false,
});

defineSlots<{
  /** Trigger label/icon content — not another interactive control, since this element is itself a `<button>`. */
  default(): unknown;
}>();

const context = usePopoverContext("PopoverTrigger");
const buttonRef = useTemplateRef<HTMLButtonElement>("buttonRef");

useOverlayTriggerRef(context?.triggerRef, buttonRef);

function onClick() {
  context?.setOpen(!context.open.value);
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
    :aria-haspopup="context?.modal.value ? 'dialog' : true"
    :aria-expanded="context?.open.value ?? false"
    :aria-controls="context?.open.value ? context?.contentId : undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>
