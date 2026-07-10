<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { cn } from "../utils/cn";
import type { ToastInstance } from "../composables/useToast";

export interface ToastProps {
  toast: ToastInstance;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<ToastProps>();

const emit = defineEmits<{
  dismiss: [];
}>();

let timer: ReturnType<typeof setTimeout> | undefined;
let remainingMs: number | null = props.toast.duration;
let startedAt = 0;

function startTimer() {
  if (remainingMs == null) return;
  startedAt = Date.now();
  timer = setTimeout(() => emit("dismiss"), remainingMs);
}

function pauseTimer() {
  if (timer === undefined) return;
  clearTimeout(timer);
  timer = undefined;
  if (remainingMs != null) remainingMs -= Date.now() - startedAt;
}

function resumeTimer() {
  if (timer !== undefined || remainingMs == null) return;
  startTimer();
}

onMounted(startTimer);
onBeforeUnmount(() => clearTimeout(timer));

const rootClass = computed(() => cn("stance-toast", props.class));
</script>

<template>
  <div
    :role="toast.urgent ? 'alert' : 'status'"
    aria-atomic="true"
    :class="rootClass"
    :data-variant="toast.variant"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    @focusin="pauseTimer"
    @focusout="resumeTimer"
  >
    <div class="stance-toast__body">
      <p v-if="toast.title" class="stance-toast__title">{{ toast.title }}</p>
      <p v-if="toast.description" class="stance-toast__description">{{ toast.description }}</p>
    </div>
    <button type="button" class="stance-toast__close" aria-label="Dismiss notification" @click="emit('dismiss')">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style>
:where(.stance-toast) {
  display: flex;
  align-items: flex-start;
  gap: var(--stance-spacing-sm, 0.5rem);
  min-width: 18rem;
  max-width: 24rem;
  background: var(--stance-color-surface);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-md, 0.75rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-surface-foreground);
  pointer-events: auto;
}

:where(.stance-toast[data-variant="success"]) {
  border-inline-start: 3px solid var(--stance-color-success, var(--stance-color-primary));
}

:where(.stance-toast[data-variant="destructive"]) {
  border-inline-start: 3px solid var(--stance-color-destructive);
}

:where(.stance-toast__body) {
  flex: 1;
  min-width: 0;
}

:where(.stance-toast__title) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  font-weight: var(--stance-font-weight-semibold, 600);
}

:where(.stance-toast__description) {
  margin: 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-toast__title + .stance-toast__description) {
  margin-top: var(--stance-spacing-xs, 0.25rem);
}

:where(.stance-toast__close) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  background: none;
  border: none;
  padding: 0;
  color: var(--stance-color-muted-foreground);
  cursor: pointer;
}

:where(.stance-toast__close:hover) {
  color: var(--stance-color-foreground);
}

:where(.stance-toast__close:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-toast__close svg) {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
