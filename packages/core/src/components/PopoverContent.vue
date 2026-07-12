<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useDismissable } from "../composables/useDismissable";
import { useFloatingOverlay } from "../composables/useFloatingOverlay";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useModalBackground } from "../composables/useModalBackground";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";
import { usePopoverContext } from "../composables/usePopover";

export interface PopoverContentProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<PopoverContentProps>();

defineSlots<{
  default(): unknown;
}>();

const context = usePopoverContext("PopoverContent");
const overlayRoot = getOverlayRoot();
const contentRef = useTemplateRef<HTMLElement>("contentRef");

const open = computed(() => context?.open.value ?? false);
const modal = computed(() => context?.modal.value ?? false);

const { floatingStyles } = useFloatingOverlay(
  computed(() => context?.triggerRef.value ?? null),
  contentRef,
  {
    open,
    placement: computed(() => context?.placement.value ?? "bottom"),
    offset: computed(() => context?.offset.value ?? 8),
  },
);

const themeContext = useOverlayThemeContext(open, () => context?.triggerRef.value ?? document.activeElement);

// Must run before useFocusTrap so that when `modal` is true, the background
// is made non-inert again before useFocusTrap tries to restore focus to the
// trigger — focusing an inert element silently fails (see the identical fix
// in Dialog.vue).
useModalBackground(open, overlayRoot, modal);

useFocusTrap({
  container: contentRef,
  active: open,
  trapTab: modal,
});

useDismissable({
  active: open,
  containers: context ? [context.triggerRef, contentRef] : [contentRef],
  closeOnEscape: computed(() => context?.closeOnEscape.value ?? true),
  closeOnOutsideClick: computed(() => context?.closeOnOutsideClick.value ?? true),
  onDismiss: () => context?.setOpen(false),
});

const contentClass = computed(() => cn("stance-popover__content", props.class));
</script>

<template>
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="open"
      ref="contentRef"
      :id="context?.contentId"
      :class="[contentClass, { dark: themeContext.dark }]"
      :style="floatingStyles"
      :data-theme="themeContext.theme ?? undefined"
      :data-theme-palette="themeContext.palette ?? undefined"
      :data-theme-density="themeContext.density ?? undefined"
      :role="modal ? 'dialog' : undefined"
      :aria-modal="modal || undefined"
      tabindex="-1"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style>
:where(.stance-popover__content) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  max-width: var(--stance-control-popover-max-width, 20rem);
  background: var(--stance-color-surface);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-md, 0.75rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-surface-foreground);
  pointer-events: auto;
}

:where(.stance-popover__content:focus-visible) {
  outline: none;
}
</style>
