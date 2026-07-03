<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface BaseButtonProps {
  /** Visual style. @default "primary" */
  variant?: ButtonVariant;
  /** Size scale — controls padding, font-size, and minimum hit-target height. @default "md" */
  size?: ButtonSize;
  /** Disables the button (sets the native `disabled` attribute). */
  disabled?: boolean;
  /**
   * Shows a spinner in place of the label/icon, sets `aria-busy`, and disables
   * interaction (to prevent double-submits) without changing layout width.
   */
  loading?: boolean;
  /** Native `type` attribute. @default "button" (never accidentally submits a form) */
  type?: "button" | "submit" | "reset";
  /** Extra classes merged with internal classes via `tailwind-merge` — the consumer's class always wins. */
  class?: string;
}

/**
 * Icon-only buttons must have an accessible name since there's no visible
 * label text — `ariaLabel` is required at the type level when `iconOnly` is
 * true, not just checked at runtime.
 */
export type ButtonProps =
  | (BaseButtonProps & { iconOnly?: false; ariaLabel?: string })
  | (BaseButtonProps & { iconOnly: true; ariaLabel: string });

// `withDefaults` can't infer defaults across a discriminated union (each
// branch has a different required shape), so defaults are applied manually
// via the computed properties below instead.
const props = defineProps<ButtonProps>();

defineSlots<{
  /** Button label text, or a single icon element when `iconOnly` is true. */
  default(): unknown;
}>();

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (props.iconOnly && !props.ariaLabel) {
      console.error("[stance/Button] icon-only buttons require an `ariaLabel` prop for accessibility.");
    }
  });
}

const variant = computed(() => props.variant ?? "primary");
const size = computed(() => props.size ?? "md");
const type = computed(() => props.type ?? "button");
const loading = computed(() => Boolean(props.loading));
const iconOnly = computed(() => Boolean(props.iconOnly));
const isDisabled = computed(() => Boolean(props.disabled) || loading.value);

const rootClass = computed(() => cn("stance-button", props.class));
</script>

<template>
  <button
    :type="type"
    :class="rootClass"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    :aria-label="props.ariaLabel"
    :data-variant="variant"
    :data-size="size"
    :data-icon-only="iconOnly || undefined"
    :data-loading="loading || undefined"
  >
    <svg
      v-if="loading"
      class="stance-button__spinner"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="stance-button__spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      <path
        class="stance-button__spinner-head"
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span class="stance-button__content" :data-hidden="loading || undefined">
      <slot />
    </span>
  </button>
</template>

<style>
:where(.stance-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: none;
  cursor: pointer;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-weight: var(--stance-font-weight-medium, 500);
  border-radius: var(--stance-radius-md, 0.5rem);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

:where(.stance-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

/* Sizes */
:where(.stance-button[data-size="sm"]) {
  gap: var(--stance-spacing-xs, 0.25rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  font-size: var(--stance-text-sm, 0.875rem);
  min-height: 2rem;
}
:where(.stance-button[data-size="md"]) {
  gap: var(--stance-spacing-sm, 0.5rem);
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  font-size: var(--stance-text-base, 1rem);
  min-height: 2.5rem;
}
:where(.stance-button[data-size="lg"]) {
  gap: var(--stance-spacing-sm, 0.5rem);
  padding: var(--stance-spacing-md, 0.75rem) var(--stance-spacing-lg, 1rem);
  font-size: var(--stance-text-lg, 1.125rem);
  min-height: 3rem;
}

/* Icon-only: square hit target, no horizontal label padding */
:where(.stance-button[data-icon-only][data-size="sm"]) {
  width: 2rem;
  padding: var(--stance-spacing-xs, 0.25rem);
}
:where(.stance-button[data-icon-only][data-size="md"]) {
  width: 2.5rem;
  padding: var(--stance-spacing-sm, 0.5rem);
}
:where(.stance-button[data-icon-only][data-size="lg"]) {
  width: 3rem;
  padding: var(--stance-spacing-md, 0.75rem);
}

/* Variants */
:where(.stance-button[data-variant="primary"]) {
  background: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
  box-shadow: var(--stance-shadow-sm);
}
:where(.stance-button[data-variant="primary"]:not(:disabled):hover) {
  background: var(--stance-color-primary-hover, var(--stance-color-primary));
}
:where(.stance-button[data-variant="primary"]:not(:disabled):active) {
  background: var(--stance-color-primary-active, var(--stance-color-primary));
}

:where(.stance-button[data-variant="secondary"]) {
  background: var(--stance-color-secondary);
  color: var(--stance-color-secondary-foreground);
}
:where(.stance-button[data-variant="secondary"]:not(:disabled):hover) {
  background: var(--stance-color-secondary-hover, var(--stance-color-secondary));
}
:where(.stance-button[data-variant="secondary"]:not(:disabled):active) {
  background: var(--stance-color-secondary-active, var(--stance-color-secondary));
}

:where(.stance-button[data-variant="ghost"]) {
  background: transparent;
  color: var(--stance-color-foreground);
}
:where(.stance-button[data-variant="ghost"]:not(:disabled):hover) {
  background: var(--stance-color-muted);
}
:where(.stance-button[data-variant="ghost"]:not(:disabled):active) {
  background: var(--stance-color-secondary-hover, var(--stance-color-muted));
}

:where(.stance-button[data-variant="destructive"]) {
  background: var(--stance-color-destructive);
  color: var(--stance-color-destructive-foreground);
  box-shadow: var(--stance-shadow-sm);
}
:where(.stance-button[data-variant="destructive"]:not(:disabled):hover) {
  background: var(--stance-color-destructive-hover, var(--stance-color-destructive));
}
:where(.stance-button[data-variant="destructive"]:not(:disabled):active) {
  background: var(--stance-color-destructive-active, var(--stance-color-destructive));
}

/* Loading spinner */
:where(.stance-button__content[data-hidden]) {
  visibility: hidden;
}

:where(.stance-button__spinner) {
  position: absolute;
  width: 1em;
  height: 1em;
  animation: stance-button-spin 0.6s linear infinite;
}

:where(.stance-button__spinner-track) {
  opacity: 0.25;
}

@keyframes stance-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  :where(.stance-button__spinner) {
    animation-duration: 1.5s;
  }
}
</style>
