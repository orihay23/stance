<script setup lang="ts">
import type { Placement } from "@floating-ui/vue";
import { computed, provide, ref, useId } from "vue";
import { POPOVER_KEY } from "../composables/usePopover";

export interface PopoverProps {
  /** v-model open state. */
  modelValue?: boolean;
  /** Preferred side/alignment relative to the trigger; flips/shifts to stay in view. @default "bottom" */
  placement?: Placement;
  /** Gap in pixels between the trigger and the content. @default 8 */
  offset?: number;
  /**
   * Off by default: content gets initial focus and focus is restored to the
   * trigger on close, but Tab is free to leave the content and the
   * background stays interactive — right for a disclosure of non-essential
   * content (info, a filter panel, a lightweight menu).
   *
   * Set true for content the user must resolve before returning to the rest
   * of the page (e.g. an inline confirmation with real actions): focus is
   * trapped and the background is made inert, same as Dialog.
   * @default false
   */
  modal?: boolean;
  /** Closes on Escape. @default true */
  closeOnEscape?: boolean;
  /** Closes on a click outside both the trigger and the content. @default true */
  closeOnOutsideClick?: boolean;
}

const props = withDefaults(defineProps<PopoverProps>(), {
  modelValue: false,
  placement: "bottom",
  offset: 8,
  modal: false,
  closeOnEscape: true,
  closeOnOutsideClick: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

defineSlots<{
  /** Expects a `<PopoverTrigger>` and a `<PopoverContent>`. */
  default(): unknown;
}>();

const baseId = useId();
const open = computed(() => props.modelValue);
const triggerRef = ref<HTMLElement | null | undefined>(null);

provide(POPOVER_KEY, {
  open,
  setOpen: (value: boolean) => emit("update:modelValue", value),
  triggerRef,
  triggerId: `${baseId}-trigger`,
  contentId: `${baseId}-content`,
  modal: computed(() => props.modal),
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
  closeOnEscape: computed(() => props.closeOnEscape),
  closeOnOutsideClick: computed(() => props.closeOnOutsideClick),
});
</script>

<template>
  <slot />
</template>
