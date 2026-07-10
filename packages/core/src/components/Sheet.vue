<script setup lang="ts">
import { computed, useId, useTemplateRef, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useDismissable } from "../composables/useDismissable";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useModalBackground } from "../composables/useModalBackground";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";

export type SheetSide = "top" | "right" | "bottom" | "left";

// An edge-anchored Dialog variant — same WAI-ARIA dialog pattern, same
// focus-trap/dismiss/inert-background composables, just `position: fixed`
// anchored to a viewport edge with a slide transition instead of Dialog's
// centered floating panel. Deliberately does not implement gesture/
// swipe-to-dismiss or drag snap-points (vaul-style) — a v1 scope cut, the
// same way TreeTable shipped without async loading in its v1. Escape,
// outside click, and a consumer-provided close button are the only ways
// to dismiss.
export interface SheetProps {
  /** v-model open state. */
  modelValue?: boolean;
  /**
   * Accessible name: rendered as the sheet's heading and wired via
   * aria-labelledby. Required for the same reason Dialog's `title` is.
   */
  title: string;
  /** Optional supporting text, wired via aria-describedby when present. */
  description?: string;
  /** Which viewport edge the panel slides in from. @default "right" */
  side?: SheetSide;
  /**
   * @default "dialog" — use "alertdialog" for confirmation/destructive-action
   * prompts, same convention as Dialog's `role`.
   */
  role?: "dialog" | "alertdialog";
  /** Closes on Escape. @default true */
  closeOnEscape?: boolean;
  /** Closes on a click outside the panel (i.e. on the backdrop). @default true */
  closeOnOutsideClick?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the panel. */
  class?: string;
}

const props = withDefaults(defineProps<SheetProps>(), {
  modelValue: false,
  side: "right",
  role: "dialog",
  closeOnEscape: true,
  closeOnOutsideClick: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

defineSlots<{
  /** Sheet body content. */
  default(): unknown;
}>();

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!props.title?.trim()) {
      console.error("[stance/Sheet] requires a non-empty `title` for accessibility.");
    }
  });
}

const isOpen = computed(() => props.modelValue);
const titleId = useId();
const descriptionId = useId();

const overlayRoot = getOverlayRoot();
const panelRef = useTemplateRef<HTMLElement>("panelRef");

const themeContext = useOverlayThemeContext(isOpen, () => document.activeElement);

useModalBackground(isOpen, overlayRoot);

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

const panelClass = computed(() => cn("stance-sheet__panel", props.class));
</script>

<template>
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <Transition name="stance-sheet-backdrop">
      <div
        v-if="isOpen"
        class="stance-sheet__backdrop"
        :data-theme="themeContext.theme ?? undefined"
        :class="{ dark: themeContext.dark }"
      >
        <Transition name="stance-sheet-panel">
          <div
            v-if="isOpen"
            ref="panelRef"
            :class="panelClass"
            :data-side="side"
            :role="role"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="description ? descriptionId : undefined"
            tabindex="-1"
          >
            <h2 :id="titleId" class="stance-sheet__title">{{ title }}</h2>
            <p v-if="description" :id="descriptionId" class="stance-sheet__description">{{ description }}</p>
            <div class="stance-sheet__body">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
:where(.stance-sheet__backdrop) {
  position: fixed;
  inset: 0;
  background: var(--stance-color-overlay, rgb(0 0 0 / 0.5));
  pointer-events: auto;
}

:where(.stance-sheet__panel) {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  background: var(--stance-color-surface);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-lg, 1rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-surface-foreground);
  overflow-y: auto;
}

:where(.stance-sheet__panel:focus-visible) {
  outline: none;
}

:where(.stance-sheet__panel[data-side="right"]) {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(24rem, 100vw);
  max-width: 100vw;
  border-left: 1px solid var(--stance-color-border);
}

:where(.stance-sheet__panel[data-side="left"]) {
  top: 0;
  left: 0;
  bottom: 0;
  width: min(24rem, 100vw);
  max-width: 100vw;
  border-right: 1px solid var(--stance-color-border);
}

:where(.stance-sheet__panel[data-side="top"]) {
  top: 0;
  left: 0;
  right: 0;
  height: min(24rem, 100vh);
  max-height: 100vh;
  border-bottom: 1px solid var(--stance-color-border);
}

:where(.stance-sheet__panel[data-side="bottom"]) {
  bottom: 0;
  left: 0;
  right: 0;
  height: min(24rem, 100vh);
  max-height: 100vh;
  border-top: 1px solid var(--stance-color-border);
}

:where(.stance-sheet__title) {
  margin: 0;
  font-size: var(--stance-text-lg, 1.125rem);
  font-weight: var(--stance-font-weight-semibold, 600);
}

:where(.stance-sheet__description) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-sheet__body) {
  font-size: var(--stance-text-base, 1rem);
}

:where(.stance-sheet-backdrop-enter-active),
:where(.stance-sheet-backdrop-leave-active) {
  transition: opacity var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-sheet-backdrop-enter-from),
:where(.stance-sheet-backdrop-leave-to) {
  opacity: 0;
}

:where(.stance-sheet-panel-enter-active),
:where(.stance-sheet-panel-leave-active) {
  transition: transform var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-sheet__panel[data-side="right"].stance-sheet-panel-enter-from),
:where(.stance-sheet__panel[data-side="right"].stance-sheet-panel-leave-to) {
  transform: translateX(100%);
}

:where(.stance-sheet__panel[data-side="left"].stance-sheet-panel-enter-from),
:where(.stance-sheet__panel[data-side="left"].stance-sheet-panel-leave-to) {
  transform: translateX(-100%);
}

:where(.stance-sheet__panel[data-side="top"].stance-sheet-panel-enter-from),
:where(.stance-sheet__panel[data-side="top"].stance-sheet-panel-leave-to) {
  transform: translateY(-100%);
}

:where(.stance-sheet__panel[data-side="bottom"].stance-sheet-panel-enter-from),
:where(.stance-sheet__panel[data-side="bottom"].stance-sheet-panel-leave-to) {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  :where(.stance-sheet-backdrop-enter-active),
  :where(.stance-sheet-backdrop-leave-active),
  :where(.stance-sheet-panel-enter-active),
  :where(.stance-sheet-panel-leave-active) {
    transition: none;
  }
}
</style>
