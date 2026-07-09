<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useComboboxContext } from "../composables/useCombobox";
import { useDismissable } from "../composables/useDismissable";
import { useFloatingOverlay } from "../composables/useFloatingOverlay";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";

export interface ComboboxContentProps {
  /** Shows the `loading` slot instead of options. */
  loading?: boolean;
  /** Shows the `error` slot instead of options (and takes priority over `loading`). */
  error?: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<ComboboxContentProps>(), {
  loading: false,
});

defineSlots<{
  /** Expects `<ComboboxOption>`s. */
  default(): unknown;
  /** Shown while `loading` is true. */
  loading?(): unknown;
  /** Shown when there are zero registered options and neither `loading` nor `error` is set — covers both "your sync list filtered to nothing" and "the async response had no matches" with one affordance. */
  empty?(): unknown;
  /** Shown when `error` is set. */
  error?(scope: { message: string }): unknown;
}>();

const context = useComboboxContext("ComboboxContent");
const overlayRoot = getOverlayRoot();
const contentRef = useTemplateRef<HTMLElement>("contentRef");

// Registers this element on the shared context, the same way
// useOverlayTriggerRef registers ComboboxInput's element — ComboboxInput's
// onBlur reads it back to tell "focus moved into the popup" apart from
// "focus actually left."
watchEffect(() => {
  if (context) context.contentRef.value = contentRef.value;
});

const open = computed(() => context?.open.value ?? false);

// useDismissable applies unmodified — Escape/outside-click both close the
// popup, per the design doc. ComboboxInput handles the "first Escape
// clears the text" nuance itself and stopPropagation()s that case, so this
// listener only ever sees the "actually close" case.
useDismissable({
  active: open,
  containers: context ? [context.triggerRef, contentRef] : [contentRef],
  onDismiss: () => context?.setOpen(false),
});

const { floatingStyles } = useFloatingOverlay(
  computed(() => context?.triggerRef.value ?? null),
  contentRef,
  {
    open,
    placement: computed(() => context?.placement.value ?? "bottom-start"),
    offset: computed(() => context?.offset.value ?? 4),
  },
);

// Width-matched to the input rather than using Floating UI's `size`
// middleware (see the design doc, §1) — re-measured whenever floatingStyles
// itself recomputes (autoUpdate already re-triggers that on resize/scroll),
// which is close enough in practice without a dedicated ResizeObserver.
const contentStyle = computed(() => ({
  ...floatingStyles.value,
  width: context?.triggerRef.value ? `${(context.triggerRef.value as HTMLElement).offsetWidth}px` : undefined,
}));

const themeContext = useOverlayThemeContext(open, () => context?.triggerRef.value ?? document.activeElement);

const contentClass = computed(() => cn("stance-combobox__content", props.class));
</script>

<template>
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="open"
      ref="contentRef"
      :id="context?.listboxId"
      role="listbox"
      :aria-multiselectable="context?.multiple.value || undefined"
      :class="[contentClass, { dark: themeContext.dark }]"
      :style="contentStyle"
      :data-theme="themeContext.theme ?? undefined"
    >
      <p v-if="error" class="stance-combobox__status stance-combobox__status--error" role="alert">
        <slot name="error" :message="error">{{ error }}</slot>
      </p>
      <p v-else-if="loading" class="stance-combobox__status">
        <slot name="loading">Loading…</slot>
      </p>
      <template v-else>
        <slot />
        <p v-if="context?.optionCount.value === 0" class="stance-combobox__status">
          <slot name="empty">No options.</slot>
        </p>
      </template>
    </div>
  </Teleport>
</template>

<style>
:where(.stance-combobox__content) {
  display: flex;
  flex-direction: column;
  max-height: 16rem;
  overflow-y: auto;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-xs, 0.25rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  pointer-events: auto;
}

:where(.stance-combobox__status) {
  margin: 0;
  padding: var(--stance-spacing-sm, 0.5rem);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-combobox__status--error) {
  color: var(--stance-color-destructive);
}
</style>
