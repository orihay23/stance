<script setup lang="ts">
import { computed, onBeforeUnmount, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useDismissable } from "../composables/useDismissable";
import { useDropdownMenuContext } from "../composables/useDropdownMenu";
import { useFloatingOverlay } from "../composables/useFloatingOverlay";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";

export interface DropdownMenuContentProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<DropdownMenuContentProps>();

defineSlots<{
  /** Expects `<DropdownMenuItem>`/`<DropdownMenuSeparator>`. */
  default(): unknown;
}>();

const context = useDropdownMenuContext("DropdownMenuContent");
const overlayRoot = getOverlayRoot();
const contentRef = useTemplateRef<HTMLElement>("contentRef");

const open = computed(() => context?.open.value ?? false);

function queryItems(): HTMLElement[] {
  if (!contentRef.value) return [];
  return Array.from(contentRef.value.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
}

// Menu items are always tabindex="-1" (roving focus is managed by explicit
// .focus() calls below, not native Tab order), so useFocusTrap's own
// "first focusable descendant" fallback would never find one — this always
// resolves to an actual item instead of relying on that fallback.
const initialFocusTarget = computed<HTMLElement | null>(() => {
  const items = queryItems();
  if (items.length === 0) return null;
  return context?.pendingFocus.value === "last" ? items[items.length - 1]! : items[0]!;
});

useFocusTrap({
  container: contentRef,
  active: open,
  trapTab: computed(() => context?.openedViaKeyboard.value ?? false),
  initialFocus: initialFocusTarget,
});

useDismissable({
  active: open,
  containers: context ? [context.triggerRef, contentRef] : [contentRef],
  onDismiss: () => context?.setOpen(false),
});

// When opened via mouse (not trapped), Tab is free to leave — closing the
// menu the moment focus actually does, matching how virtually every
// dropdown menu behaves (unlike Popover, which allows non-modal content to
// stay open while the rest of the page is used).
function onFocusout(event: FocusEvent) {
  if (context?.openedViaKeyboard.value) return;
  const next = event.relatedTarget as Node | null;
  // Only "still within the content" (e.g. moving between items via mouse
  // hover) should be ignored — landing back on the trigger itself (Tab can
  // wrap there when the teleported content has nothing after it in the
  // document) is just as much "leaving" as landing anywhere else.
  if (next && contentRef.value?.contains(next)) return;
  context?.setOpen(false);
}

function focusItem(item: HTMLElement | undefined) {
  item?.focus();
}

function currentIndex(items: HTMLElement[]): number {
  return items.indexOf(document.activeElement as HTMLElement);
}

let typeaheadBuffer = "";
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

function onContentKeydown(event: KeyboardEvent) {
  const items = queryItems();
  if (items.length === 0) return;

  // Items are tabindex="-1" by design (roving focus, not native Tab order),
  // so useFocusTrap's own Tab-cycling can't find any "focusable" descendant
  // to wrap between — Tab/Shift+Tab are handled here instead, identically to
  // ArrowDown/ArrowUp, and only when the menu is actually trapping (opened
  // via keyboard); otherwise Tab is left alone to leave the menu.
  const isForwardTab = event.key === "Tab" && !event.shiftKey && (context?.openedViaKeyboard.value ?? false);
  const isBackwardTab = event.key === "Tab" && event.shiftKey && (context?.openedViaKeyboard.value ?? false);

  if (event.key === "ArrowDown" || isForwardTab) {
    event.preventDefault();
    const i = currentIndex(items);
    focusItem(items[(i + 1) % items.length]);
  } else if (event.key === "ArrowUp" || isBackwardTab) {
    event.preventDefault();
    const i = currentIndex(items);
    focusItem(items[(i - 1 + items.length) % items.length]);
  } else if (event.key === "Home") {
    event.preventDefault();
    focusItem(items[0]);
  } else if (event.key === "End") {
    event.preventDefault();
    focusItem(items[items.length - 1]);
  } else if (event.key.length === 1 && /\S/.test(event.key)) {
    clearTimeout(typeaheadTimer);
    typeaheadBuffer += event.key.toLowerCase();
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer = "";
    }, 500);
    const i = currentIndex(items);
    const ordered = [...items.slice(i + 1), ...items.slice(0, i + 1)];
    const match = ordered.find((el) => el.textContent?.trim().toLowerCase().startsWith(typeaheadBuffer));
    focusItem(match);
  }
}

onBeforeUnmount(() => {
  clearTimeout(typeaheadTimer);
});

const { floatingStyles } = useFloatingOverlay(
  computed(() => context?.virtualReference.value ?? context?.triggerRef.value ?? null),
  contentRef,
  {
    open,
    placement: computed(() => context?.placement.value ?? "bottom-start"),
    offset: computed(() => context?.offset.value ?? 4),
  },
);

const themeContext = useOverlayThemeContext(open, () => context?.triggerRef.value ?? document.activeElement);

const contentClass = computed(() => cn("stance-dropdown-menu__content", props.class));
</script>

<template>
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="open"
      ref="contentRef"
      :id="context?.contentId"
      role="menu"
      :aria-labelledby="context?.triggerId"
      :class="[contentClass, { dark: themeContext.dark }]"
      :style="floatingStyles"
      :data-theme="themeContext.theme ?? undefined"
      :data-theme-palette="themeContext.palette ?? undefined"
      :data-theme-density="themeContext.density ?? undefined"
      tabindex="-1"
      @keydown="onContentKeydown"
      @focusout="onFocusout"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style>
:where(.stance-dropdown-menu__content) {
  display: flex;
  flex-direction: column;
  min-width: 10rem;
  background: var(--stance-color-surface);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-xs, 0.25rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  pointer-events: auto;
}

:where(.stance-dropdown-menu__content:focus-visible) {
  outline: none;
}
</style>
