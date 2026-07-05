<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { popBackgroundInert, pushBackgroundInert } from "../utils/inert-background";
import { detectThemeContext } from "../utils/theme-context";
import { useDismissable } from "../composables/useDismissable";
import { useFocusTrap } from "../composables/useFocusTrap";
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

const { floatingStyles } = useFloating(
  computed(() => context?.triggerRef.value ?? null),
  contentRef,
  {
    open,
    placement: computed(() => context?.placement.value ?? "bottom"),
    middleware: computed(() => [
      offset(context?.offset.value ?? 8),
      flip(),
      shift({ padding: 8 }),
    ]),
    whileElementsMounted: autoUpdate,
  },
);

const themeContext = ref(detectThemeContext(null));

// Registered before useFocusTrap so that when `modal` is true, the
// background is made non-inert again before useFocusTrap tries to restore
// focus to the trigger — focusing an inert element silently fails (see the
// identical fix in Dialog.vue).
watch(open, (isOpen) => {
  if (isOpen) {
    themeContext.value = detectThemeContext(context?.triggerRef.value ?? document.activeElement);
    if (modal.value) pushBackgroundInert(overlayRoot);
  } else {
    if (modal.value) popBackgroundInert();
  }
});

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

onBeforeUnmount(() => {
  if (open.value && modal.value) popBackgroundInert();
});

const contentClass = computed(() => cn("stance-popover__content", props.class));
</script>

<template>
  <Teleport :to="overlayRoot">
    <div
      v-if="open"
      ref="contentRef"
      :id="context?.contentId"
      :class="[contentClass, { dark: themeContext.dark }]"
      :style="floatingStyles"
      :data-theme="themeContext.theme ?? undefined"
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
  max-width: 20rem;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-md, 0.75rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-foreground);
  pointer-events: auto;
}

:where(.stance-popover__content:focus-visible) {
  outline: none;
}
</style>
