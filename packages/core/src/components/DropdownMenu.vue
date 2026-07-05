<script setup lang="ts">
import type { Placement } from "@floating-ui/vue";
import { computed, provide, ref, useId } from "vue";
import { DROPDOWN_MENU_KEY } from "../composables/useDropdownMenu";

export interface DropdownMenuProps {
  /** v-model open state. */
  modelValue?: boolean;
  /** @default "bottom-start" — left-aligned with the trigger, unlike Popover's centered default. */
  placement?: Placement;
  /** Gap in pixels between the trigger and the menu. @default 4 */
  offset?: number;
}

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  modelValue: false,
  placement: "bottom-start",
  offset: 4,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

defineSlots<{
  /** Expects a `<DropdownMenuTrigger>` and a `<DropdownMenuContent>`. */
  default(): unknown;
}>();

const baseId = useId();
const open = computed(() => props.modelValue);
const triggerRef = ref<HTMLElement | null | undefined>(null);
const openedViaKeyboard = ref(false);
const pendingFocus = ref<"first" | "last">("first");

provide(DROPDOWN_MENU_KEY, {
  open,
  setOpen: (value: boolean) => emit("update:modelValue", value),
  triggerRef,
  triggerId: `${baseId}-trigger`,
  contentId: `${baseId}-content`,
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
  openedViaKeyboard,
  pendingFocus,
});
</script>

<template>
  <slot />
</template>
