<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";
import { useDropdownMenuContext } from "../composables/useDropdownMenu";

export interface DropdownMenuItemProps {
  disabled?: boolean;
  /**
   * Renders as an `<a>` instead of a `<div>` — for menu items that navigate
   * (e.g. Breadcrumb's collapsed-items menu) rather than just performing an
   * action. Omitted (or when `disabled`) when `disabled` is true, so a
   * disabled item can't still be followed by mouse.
   */
  href?: string | undefined;
  /** Style as a destructive action (e.g. "Delete"). @default "default" */
  variant?: "default" | "destructive";
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
  disabled: false,
  variant: "default",
});

const emit = defineEmits<{
  select: [];
}>();

defineSlots<{
  default(): unknown;
}>();

const context = useDropdownMenuContext("DropdownMenuItem");

function activate() {
  if (props.disabled) return;
  emit("select");
  context?.setOpen(false);
}

function onKeydown(event: KeyboardEvent) {
  // A focused <a href> already synthesizes its own click on Enter (which
  // @click below handles) — handling Enter here too would double-fire.
  // Space isn't natively supported by links, so it's always handled here.
  if (event.key === "Enter" && props.href) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (props.href) {
      (event.currentTarget as HTMLElement).click();
    } else {
      activate();
    }
  }
}

function onMouseenter(event: MouseEvent) {
  if (props.disabled) return;
  (event.currentTarget as HTMLElement).focus();
}

const itemClass = computed(() => cn("stance-dropdown-menu__item", props.class));
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    role="menuitem"
    tabindex="-1"
    :class="itemClass"
    :data-variant="variant"
    :href="disabled ? undefined : href"
    :aria-disabled="disabled || undefined"
    @click="activate"
    @keydown="onKeydown"
    @mouseenter="onMouseenter"
  >
    <slot />
  </component>
</template>

<style>
:where(.stance-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-sm, 0.5rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  border-radius: var(--stance-radius-sm, 0.25rem);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-foreground);
  cursor: pointer;
  user-select: none;
}

:where(.stance-dropdown-menu__item:focus) {
  outline: none;
  background: var(--stance-color-muted);
}

:where(.stance-dropdown-menu__item[aria-disabled="true"]) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.stance-dropdown-menu__item[data-variant="destructive"]) {
  color: var(--stance-color-destructive);
}

:where(.stance-dropdown-menu__item[data-variant="destructive"]:focus) {
  background: var(--stance-color-destructive);
  color: var(--stance-color-destructive-foreground);
}
</style>
