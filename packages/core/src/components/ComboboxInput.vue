<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { useComboboxContext } from "../composables/useCombobox";
import { useOverlayTriggerRef } from "../composables/useOverlayTriggerRef";

defineOptions({ inheritAttrs: false });

export interface ComboboxInputProps {
  placeholder?: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = defineProps<ComboboxInputProps>();

const context = useComboboxContext("ComboboxInput");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

useOverlayTriggerRef(context?.triggerRef, inputRef);

function onInput(event: Event) {
  context?.setInputValue((event.target as HTMLInputElement).value);
  context?.setOpen(true);
  context?.activeDescendant.reset();
}

function onFocus() {
  context?.setOpen(true);
}

function onBlur(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (next && context?.contentRef.value?.contains(next)) return;
  context?.setOpen(false);
}

function onKeydown(event: KeyboardEvent) {
  if (!context) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!context.open.value) {
      context.setOpen(true);
      // ComboboxOptions register themselves on mount, which only happens
      // once Vue commits ComboboxContent's now-true v-if — one tick after
      // setOpen above, not synchronously within it. Calling moveFirst()
      // before that tick would find an empty itemIds list and silently
      // highlight nothing.
      void nextTick().then(() => context.activeDescendant.moveFirst());
    } else {
      context.activeDescendant.moveNext();
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!context.open.value) {
      context.setOpen(true);
      void nextTick().then(() => context.activeDescendant.moveLast());
    } else {
      context.activeDescendant.movePrev();
    }
    // Home/End are deliberately NOT forwarded to activeDescendant here —
    // they need to stay native text-cursor movement inside a text input.
    // useActiveDescendant's bundled onKeydown() (which does handle
    // Home/End) is meant for a consumer without that conflict, e.g. a
    // future standalone Listbox with no text entry.
  } else if (event.key === "Enter") {
    if (context.open.value) {
      event.preventDefault();
      context.commitActive();
    }
  } else if (event.key === "Escape" && context.inputValue.value) {
    // First Escape clears the typed text and keeps the popup open, rather
    // than closing it — stopPropagation so useDismissable's document-level
    // Escape listener (which closes the popup) only ever sees a second
    // press on an already-empty input. No change to useDismissable itself,
    // per the design doc.
    event.stopPropagation();
    context.setInputValue("");
  }
}

const inputClass = computed(() => cn("stance-combobox__input", props.class));
</script>

<template>
  <input
    :id="context?.inputId"
    ref="inputRef"
    v-bind="$attrs"
    type="text"
    role="combobox"
    autocomplete="off"
    :class="inputClass"
    :value="context?.inputValue.value"
    :placeholder="placeholder"
    :disabled="context?.disabled.value"
    aria-autocomplete="list"
    :aria-expanded="context?.open.value ?? false"
    :aria-controls="context?.open.value ? context?.listboxId : undefined"
    :aria-activedescendant="context?.activeDescendant.activeId.value ?? undefined"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>

<style>
:where(.stance-combobox__input) {
  display: block;
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  padding: var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-base, 1rem);
  color: var(--stance-color-foreground);
  transition:
    border-color var(--stance-motion-duration, 0.15s) ease,
    outline-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-combobox__input:focus) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
  border-color: var(--stance-color-ring);
}

:where(.stance-combobox__input::placeholder) {
  color: var(--stance-color-muted-foreground);
}

:where(.stance-combobox__input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
