<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { detectThemeContext } from "../utils/theme-context";
import { useToast } from "../composables/useToast";
import Toast from "./Toast.vue";

export interface ToastRegionProps {
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<ToastRegionProps>();

const { toasts, dismiss } = useToast();
const overlayRoot = getOverlayRoot();

// Toasts are triggered from arbitrary application code with no trigger
// element to anchor theme detection to (unlike Dialog/Popover), so instead
// this detects the ambient theme from wherever ToastRegion itself is
// mounted — normally once, near the app root — via a zero-size anchor
// rendered in place (not teleported). Re-detected whenever the toast list
// changes, not instantly on a live theme/dark-mode toggle.
const anchorRef = useTemplateRef<HTMLElement>("anchorRef");
const themeContext = computed(() => {
  void toasts.value.length;
  return detectThemeContext(anchorRef.value);
});

const rootClass = computed(() => cn("stance-toast-region", props.class));
</script>

<template>
  <span ref="anchorRef" aria-hidden="true" style="display: none" />
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="toasts.length > 0"
      role="region"
      aria-label="Notifications"
      :class="[rootClass, { dark: themeContext.dark }]"
      :data-theme="themeContext.theme ?? undefined"
      :data-theme-palette="themeContext.palette ?? undefined"
      :data-theme-density="themeContext.density ?? undefined"
    >
      <Toast v-for="t in toasts" :key="t.id" :toast="t" @dismiss="dismiss(t.id)" />
    </div>
  </Teleport>
</template>

<style>
:where(.stance-toast-region) {
  position: fixed;
  inset-block-end: var(--stance-spacing-lg, 1rem);
  inset-inline-end: var(--stance-spacing-lg, 1rem);
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  pointer-events: none;
}
</style>
