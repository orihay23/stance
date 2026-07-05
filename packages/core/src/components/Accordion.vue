<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { cn } from "../utils/cn";
import { ACCORDION_KEY } from "../composables/useAccordion";

export interface AccordionProps {
  /**
   * v-model open item(s). A `string` (or `undefined` for none open) in
   * `type="single"`; a `string[]` (or empty for none open) in
   * `type="multiple"`. Kept as a plain union rather than discriminated by
   * `type` — see ToggleGroup for why (`withDefaults` can't infer defaults
   * across a discriminated union).
   */
  modelValue?: string | string[];
  /** @default "single" */
  type?: "single" | "multiple";
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<AccordionProps>(), {
  type: "single",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | undefined];
}>();

defineSlots<{
  /** One or more `<AccordionItem>`s. */
  default(): unknown;
}>();

const accordionId = useId();

function isOpen(value: string): boolean {
  if (props.type === "multiple") {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  }
  return props.modelValue === value;
}

function toggle(value: string) {
  if (props.type === "multiple") {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    emit("update:modelValue", next);
  } else {
    const current = typeof props.modelValue === "string" ? props.modelValue : undefined;
    emit("update:modelValue", current === value ? undefined : value);
  }
}

provide(ACCORDION_KEY, {
  type: computed(() => props.type),
  isOpen,
  toggle,
  accordionId,
});

const rootClass = computed(() => cn("stance-accordion", props.class));
</script>

<template>
  <div :class="rootClass">
    <slot />
  </div>
</template>

<style>
:where(.stance-accordion) {
  display: flex;
  flex-direction: column;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}
</style>
