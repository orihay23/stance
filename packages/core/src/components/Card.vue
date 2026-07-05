<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../utils/cn";

export type CardVariant = "elevated" | "outlined" | "flat";

export interface CardProps {
  /** @default "elevated" */
  variant?: CardVariant;
  /**
   * Heading level for the `header` slot's title, exposed to that slot as
   * `headingTag` (e.g. `"h2"`) rather than hardcoded — pick whatever is
   * correct for the card's position in the surrounding document outline.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Renders the card as a real `<a href>` instead of a static `<div>`. */
  href?: string;
  /** Renders the card as a real `<button>` instead of a static `<div>` (ignored when `href` is set). */
  interactive?: boolean;
  /** Only meaningful when `interactive` (button form) — anchors have no native disabled state. */
  disabled?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — the consumer's class always wins. */
  class?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: "elevated",
  headingLevel: 3,
});

const slots = defineSlots<{
  /** Main card content. */
  default(): unknown;
  /** Rendered above the body; scoped with `headingTag` for the title's heading level. */
  header?(props: { headingTag: string }): unknown;
  /** Rendered below the body. */
  footer?(): unknown;
}>();

const rootTag = computed(() => (props.href ? "a" : props.interactive ? "button" : "div"));
const isInteractive = computed(() => rootTag.value !== "div");
const headingTag = computed(() => `h${props.headingLevel}`);

const rootClass = computed(() => cn("stance-card", props.class));
</script>

<template>
  <component
    :is="rootTag"
    :class="rootClass"
    :href="rootTag === 'a' ? href : undefined"
    :type="rootTag === 'button' ? 'button' : undefined"
    :disabled="rootTag === 'button' ? disabled : undefined"
    :data-variant="variant"
    :data-interactive="isInteractive || undefined"
  >
    <div v-if="slots.header" class="stance-card__header">
      <slot name="header" :heading-tag="headingTag" />
    </div>
    <div class="stance-card__body">
      <slot />
    </div>
    <div v-if="slots.footer" class="stance-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<style>
:where(.stance-card) {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--stance-color-surface);
  color: var(--stance-color-surface-foreground);
  border-radius: var(--stance-radius-lg, 0.75rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  text-align: start;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

:where(.stance-card[data-variant="elevated"]) {
  border: 1px solid var(--stance-color-border);
  box-shadow: var(--stance-shadow-md);
}
:where(.stance-card[data-variant="outlined"]) {
  border: 1px solid var(--stance-color-border);
}
:where(.stance-card[data-variant="flat"]) {
  border: none;
}

:where(.stance-card[data-interactive]) {
  cursor: pointer;
  appearance: none;
  font: inherit;
  color: inherit;
}

:where(.stance-card[data-interactive]:not(:disabled):hover) {
  background: var(--stance-color-surface-hover, var(--stance-color-surface));
}
:where(.stance-card[data-interactive]:not(:disabled):active) {
  background: var(--stance-color-surface-active, var(--stance-color-surface));
}

:where(.stance-card[data-interactive]:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-card[data-interactive]:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

/*
 * Header/body/footer share one padding rule (sides + bottom) so adjoining
 * sections don't double up on vertical spacing; only the section that ends
 * up first in the rendered DOM (header if present, else the body) also gets
 * top padding — :first-child means this doesn't need to know which slots
 * are in use.
 */
:where(.stance-card__header),
:where(.stance-card__body),
:where(.stance-card__footer) {
  padding: 0 var(--stance-spacing-lg, 1rem) var(--stance-spacing-lg, 1rem);
}
:where(.stance-card__header:first-child),
:where(.stance-card__body:first-child),
:where(.stance-card__footer:first-child) {
  padding-top: var(--stance-spacing-lg, 1rem);
}

:where(.stance-card__body) {
  flex: 1;
}
</style>
