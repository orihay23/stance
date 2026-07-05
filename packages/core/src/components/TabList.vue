<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { useTabsContext } from "../composables/useTabs";

export interface TabListProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<TabListProps>();

defineSlots<{
  /** One or more `<Tab>`s. */
  default(): unknown;
}>();

const context = useTabsContext("TabList");
const listRef = useTemplateRef<HTMLElement>("listRef");

function queryTabs(): HTMLElement[] {
  if (!listRef.value) return [];
  return Array.from(listRef.value.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
}

function activate(tab: HTMLElement | undefined) {
  if (!tab) return;
  tab.focus();
  const value = tab.dataset.value;
  if (value !== undefined) context?.setActive(value);
}

// Automatic activation: moving focus with arrow keys also selects the tab
// (chosen over manual Enter/Space activation since panel switches here are
// assumed cheap — no per-tab data fetch to avoid triggering early).
function onKeydown(event: KeyboardEvent) {
  const tabs = queryTabs();
  if (tabs.length === 0) return;

  const vertical = context?.orientation.value === "vertical";
  const nextKey = vertical ? "ArrowDown" : "ArrowRight";
  const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
  const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);

  if (event.key === nextKey) {
    event.preventDefault();
    activate(tabs[(currentIndex + 1) % tabs.length]);
  } else if (event.key === prevKey) {
    event.preventDefault();
    activate(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
  } else if (event.key === "Home") {
    event.preventDefault();
    activate(tabs[0]);
  } else if (event.key === "End") {
    event.preventDefault();
    activate(tabs[tabs.length - 1]);
  }
}

const rootClass = computed(() => cn("stance-tablist", props.class));
</script>

<template>
  <div
    ref="listRef"
    role="tablist"
    :aria-orientation="context?.orientation.value ?? 'horizontal'"
    :class="rootClass"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>

<style>
:where(.stance-tablist) {
  display: flex;
  gap: var(--stance-spacing-xs, 0.25rem);
  border-bottom: 1px solid var(--stance-color-border);
}

:where(.stance-tablist[aria-orientation="vertical"]) {
  flex-direction: column;
  border-bottom: none;
  border-inline-end: 1px solid var(--stance-color-border);
  padding-inline-end: var(--stance-spacing-sm, 0.5rem);
}
</style>
