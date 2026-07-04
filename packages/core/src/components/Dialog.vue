<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, useTemplateRef, watch, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { popBackgroundInert, pushBackgroundInert } from "../utils/inert-background";
import { detectThemeContext } from "../utils/theme-context";
import { useDismissable } from "../composables/useDismissable";
import { useFocusTrap } from "../composables/useFocusTrap";

export interface DialogProps {
  /** v-model open state. */
  modelValue?: boolean;
  /**
   * Accessible name: rendered as the dialog's heading and wired via
   * aria-labelledby. Required — a dialog with no name is a real
   * accessibility gap, not a cosmetic one.
   */
  title: string;
  /** Optional supporting text, wired via aria-describedby when present. */
  description?: string;
  /**
   * @default "dialog" — use "alertdialog" for confirmation/destructive-action
   * prompts that should interrupt more assertively (most screen readers
   * announce it more urgently than a plain dialog).
   */
  role?: "dialog" | "alertdialog";
  /** Closes on Escape. @default true */
  closeOnEscape?: boolean;
  /** Closes on a click outside the panel (i.e. on the backdrop). @default true */
  closeOnOutsideClick?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the panel. */
  class?: string;
}

const props = withDefaults(defineProps<DialogProps>(), {
  modelValue: false,
  role: "dialog",
  closeOnEscape: true,
  closeOnOutsideClick: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

defineSlots<{
  /** Dialog body content. */
  default(): unknown;
}>();

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!props.title?.trim()) {
      console.error("[stance/Dialog] requires a non-empty `title` for accessibility.");
    }
  });
}

const isOpen = computed(() => props.modelValue);
const titleId = useId();
const descriptionId = useId();

const overlayRoot = getOverlayRoot();
const panelRef = useTemplateRef<HTMLElement>("panelRef");

const themeContext = ref(detectThemeContext(null));

// Registered before useFocusTrap so that on close, the background is made
// non-inert again before useFocusTrap tries to restore focus to whatever
// triggered the dialog — focusing an inert element silently fails, which
// would otherwise leave focus stranded on <body>.
watch(isOpen, (open) => {
  if (open) {
    // document.activeElement here is still whatever triggered the dialog
    // (before useFocusTrap moves focus away), which is still in its
    // original DOM location even though the dialog's own output teleports.
    themeContext.value = detectThemeContext(document.activeElement);
    pushBackgroundInert(overlayRoot);
  } else {
    popBackgroundInert();
  }
});

useFocusTrap({
  container: panelRef,
  active: isOpen,
});

useDismissable({
  active: isOpen,
  containers: [panelRef],
  closeOnEscape: computed(() => props.closeOnEscape),
  closeOnOutsideClick: computed(() => props.closeOnOutsideClick),
  onDismiss: () => emit("update:modelValue", false),
});

onBeforeUnmount(() => {
  if (isOpen.value) popBackgroundInert();
});

const panelClass = computed(() => cn("stance-dialog__panel", props.class));
</script>

<template>
  <Teleport :to="overlayRoot">
    <div
      v-if="isOpen"
      class="stance-dialog__backdrop"
      :data-theme="themeContext.theme ?? undefined"
      :class="{ dark: themeContext.dark }"
    >
      <div
        ref="panelRef"
        :class="panelClass"
        :role="role"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="-1"
      >
        <h2 :id="titleId" class="stance-dialog__title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="stance-dialog__description">{{ description }}</p>
        <div class="stance-dialog__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
:where(.stance-dialog__backdrop) {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--stance-spacing-lg, 1rem);
  background: var(--stance-color-overlay, rgb(0 0 0 / 0.5));
  pointer-events: auto;
}

:where(.stance-dialog__panel) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  width: 100%;
  max-width: 32rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-lg, 0.75rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-lg, 1rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-dialog__panel:focus-visible) {
  outline: none;
}

:where(.stance-dialog__title) {
  margin: 0;
  font-size: var(--stance-text-lg, 1.125rem);
  font-weight: var(--stance-font-weight-semibold, 600);
}

:where(.stance-dialog__description) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-dialog__body) {
  font-size: var(--stance-text-base, 1rem);
}
</style>
