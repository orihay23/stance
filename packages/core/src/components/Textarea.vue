<script setup lang="ts">
import { computed, nextTick, onMounted, useId, useTemplateRef, watch } from "vue";
import { cn } from "../utils/cn";
import { useErrorSlot } from "../composables/useErrorSlot";

// The template has two root nodes (the <textarea> and the conditional error
// <p>), so Vue disables automatic attrs fallthrough regardless of which root
// is the real form control — same reason Input needs this, just without a
// wrapper div in between.
defineOptions({ inheritAttrs: false });

export interface TextareaProps {
  /** v-model value. */
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  /**
   * Marks invalid: sets `aria-invalid`, and — when the `error` slot has
   * content — wires `aria-describedby` to it automatically.
   */
  invalid?: boolean;
  /** Initial/minimum visible text lines. @default 3 */
  rows?: number;
  /** Grows the height to fit content as the user types, starting from `rows`. */
  autoGrow?: boolean;
  /**
   * Caps auto-grow height at this many lines; beyond it, the textarea
   * scrolls internally instead of growing further (so keyboard scrolling —
   * arrow keys, Page Up/Down — keeps working instead of content clipping
   * silently). Ignored unless `autoGrow` is true.
   */
  maxRows?: number;
  /** id for the underlying `<textarea>`. Auto-generated via `useId()` if omitted. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — the consumer's class always wins. */
  class?: string;
}

const props = withDefaults(defineProps<TextareaProps>(), {
  disabled: false,
  readonly: false,
  required: false,
  invalid: false,
  rows: 3,
  autoGrow: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const slots = defineSlots<{
  /** Error message shown — and wired to `aria-describedby` — when `invalid` is true. */
  error?(): unknown;
}>();

const generatedId = useId();
const textareaId = computed(() => props.id ?? generatedId);
const { errorId, showError, describedBy } = useErrorSlot(
  () => textareaId.value,
  () => props.invalid,
  () => Boolean(slots.error),
);

const rootClass = computed(() => cn("stance-textarea", props.class));

const textareaRef = useTemplateRef<HTMLTextAreaElement>("textareaRef");

function resize() {
  const el = textareaRef.value;
  if (!el || !props.autoGrow) return;

  el.style.height = "auto";
  const styles = getComputedStyle(el);
  const borderY = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
  let newHeight = el.scrollHeight + borderY;

  if (props.maxRows) {
    const lineHeight = parseFloat(styles.lineHeight);
    const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * props.maxRows + paddingY + borderY;
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      el.style.overflowY = "auto";
    } else {
      el.style.overflowY = "hidden";
    }
  }

  el.style.height = `${newHeight}px`;
}

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  resize();
}

watch(
  () => props.modelValue,
  () => {
    if (props.autoGrow) nextTick(resize);
  },
);

onMounted(() => {
  if (props.autoGrow) resize();
});
</script>

<template>
  <textarea
    ref="textareaRef"
    v-bind="$attrs"
    :id="textareaId"
    :class="rootClass"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rows="rows"
    :data-invalid="invalid || undefined"
    :data-auto-grow="autoGrow || undefined"
    :aria-invalid="invalid || undefined"
    :aria-describedby="describedBy"
    @input="onInput"
  />

  <p v-if="showError" :id="errorId" class="stance-textarea-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-textarea) {
  display: block;
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  padding: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  line-height: var(--stance-leading-normal, 1.5);
  color: var(--stance-color-foreground);
  transition:
    border-color var(--stance-motion-duration, 0.15s) ease,
    outline-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-textarea[data-auto-grow]) {
  resize: none;
  overflow-y: hidden;
}

:where(.stance-textarea::placeholder) {
  color: var(--stance-color-muted-foreground);
}

:where(.stance-textarea:focus-visible) {
  border-color: var(--stance-color-ring);
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-textarea[data-invalid]) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-textarea[data-invalid]:focus-visible) {
  border-color: var(--stance-color-destructive);
  outline-color: var(--stance-color-destructive);
}

:where(.stance-textarea:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-textarea-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}
</style>
