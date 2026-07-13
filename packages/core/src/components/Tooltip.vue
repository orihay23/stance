<script setup lang="ts">
import type { Placement } from "@floating-ui/vue";
import { computed, onBeforeUnmount, ref, useId, useTemplateRef, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useDismissable } from "../composables/useDismissable";
import { useFloatingOverlay } from "../composables/useFloatingOverlay";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";

export interface TooltipProps {
  /** Tooltip text. Ignored if the `content` slot is given (for richer, still non-interactive content). */
  content?: string;
  /** @default "top" */
  placement?: Placement;
  /** Gap in pixels between the trigger and the tooltip. @default 8 */
  offset?: number;
  /** Delay before showing, so an incidental mouse pass-over doesn't flash a tooltip. @default 400 */
  openDelay?: number;
  /** Delay before hiding. @default 0 */
  closeDelay?: number;
  /** Suppresses showing entirely. */
  disabled?: boolean;
  /**
   * Adds `tabindex="0"` to the wrapping trigger element so non-interactive
   * slot content (a bare icon, truncated text) can still receive keyboard
   * focus and trigger the tooltip. Skip this when wrapping already-focusable
   * content (a Button, a link) — it would add a duplicate tab stop, and the
   * inner element's own focus/blur already bubbles up to show/hide this.
   * @default false
   */
  focusable?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the tooltip bubble. */
  class?: string;
}

const props = withDefaults(defineProps<TooltipProps>(), {
  placement: "top",
  offset: 8,
  openDelay: 400,
  closeDelay: 0,
  disabled: false,
  focusable: false,
});

const slots = defineSlots<{
  /**
   * The element the tooltip describes. Wrapped in a plain `<span>` so
   * hover/focus can be observed regardless of what it is — note that
   * `aria-describedby` lives on that wrapping span, so it's only read by
   * assistive tech at the moment of focus when the span itself is the
   * focused element (i.e. when `focusable` is true, or the slot content
   * doesn't already contain its own focusable control).
   */
  default(): unknown;
  /** Overrides `content` for richer (but still non-interactive) tooltip bodies. */
  content?(): unknown;
}>();

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!props.content?.trim() && !slots.content) {
      console.error("[stance/Tooltip] requires either a `content` prop or a `content` slot.");
    }
  });
}

const baseId = useId();
const contentId = `${baseId}-content`;
const open = ref(false);
const overlayRoot = getOverlayRoot();
const triggerRef = useTemplateRef<HTMLElement>("triggerRef");
const contentRef = useTemplateRef<HTMLElement>("contentRef");

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function show() {
  if (props.disabled) return;
  clearTimeout(hideTimer);
  showTimer = setTimeout(() => {
    open.value = true;
  }, props.openDelay);
}

function hide() {
  clearTimeout(showTimer);
  hideTimer = setTimeout(() => {
    open.value = false;
  }, props.closeDelay);
}

// Cancels a pending hide without re-triggering openDelay — used when the
// pointer moves from the trigger onto the (now hoverable) content bubble,
// per WCAG 1.4.13: hover-triggered content must itself be hoverable.
function cancelHide() {
  clearTimeout(hideTimer);
}

onBeforeUnmount(() => {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
});

// Escape hides the tooltip while it's visible. Tooltip isn't click-toggled,
// so outside-click detection is disabled; there's no useFocusTrap at all
// since content is non-interactive and focus never leaves the trigger.
useDismissable({
  active: open,
  containers: [triggerRef, contentRef],
  closeOnOutsideClick: computed(() => false),
  onDismiss: hide,
});

const { floatingStyles } = useFloatingOverlay(triggerRef, contentRef, {
  open,
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
});

const themeContext = useOverlayThemeContext(open, () => triggerRef.value);

const contentClass = computed(() => cn("stance-tooltip__content", props.class));
</script>

<template>
  <span
    ref="triggerRef"
    class="stance-tooltip-trigger"
    :tabindex="focusable ? 0 : undefined"
    :aria-describedby="open ? contentId : undefined"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
  </span>

  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="open"
      ref="contentRef"
      :id="contentId"
      role="tooltip"
      :class="[contentClass, { dark: themeContext.dark }]"
      :style="floatingStyles"
      :data-theme="themeContext.theme ?? undefined"
      :data-theme-palette="themeContext.palette ?? undefined"
      :data-theme-density="themeContext.density ?? undefined"
      @mouseenter="cancelHide"
      @mouseleave="hide"
    >
      <slot name="content">{{ content }}</slot>
    </div>
  </Teleport>
</template>

<style>
:where(.stance-tooltip-trigger) {
  display: inline-block;
}

:where(.stance-tooltip__content) {
  max-width: var(--stance-control-tooltip-max-width, 16rem);
  background: var(--stance-color-foreground);
  color: var(--stance-color-background);
  border-radius: var(--stance-radius-sm, 0.25rem);
  box-shadow: var(--stance-shadow-md, var(--stance-shadow-sm));
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-sm, 0.875rem);
}
</style>
