<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from "vue";
import { cn } from "../utils/cn";
import { useComboboxContext } from "../composables/useCombobox";
import { useOverlayTriggerRef } from "../composables/useOverlayTriggerRef";

defineOptions({ inheritAttrs: false });

export interface ComboboxInputProps {
  placeholder?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the wrapper (which also holds multi-select's tags), not the bare `<input>`, same convention as Input.vue. */
  class?: string;
}

const props = defineProps<ComboboxInputProps>();

const context = useComboboxContext("ComboboxInput");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const wrapperRef = useTemplateRef<HTMLElement>("wrapperRef");

// The floating-ui anchor (and useDismissable's "inside" container, and the
// element ComboboxContent measures for width-matching) is the whole
// wrapper, not the bare `<input>` — in multi-select mode the input is a
// flex child sitting after the tags, so anchoring to it alone would
// visibly misalign the popup against the tag row and undermeasure the
// width.
useOverlayTriggerRef(context?.triggerRef, wrapperRef);

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

function removeTag(value: string) {
  if (!context) return;
  context.selectValue(value, context.tagLabel(value));
  // The tag (and its own remove button) is gone from the DOM the instant
  // this runs, so focus would otherwise fall back to <body> — bring it
  // back to the input, matching how removing a tag never moves focus in
  // the resolved design (design doc, §3).
  inputRef.value?.focus();
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
  } else if (event.key === "Backspace" && context.multiple.value && !context.inputValue.value) {
    // Backspace on an already-empty input removes the last tag
    // immediately — no "arm, then confirm" step. See the design doc, §3,
    // for why: the two-step version guards against a mistake this
    // pattern's users essentially never make while still typing.
    const values = context.selectedValues.value;
    if (values.length > 0) removeTag(values[values.length - 1]!);
  }
}

const wrapperClass = computed(() => cn("stance-combobox__input-wrapper", props.class));
</script>

<template>
  <div ref="wrapperRef" :class="wrapperClass" :data-disabled="context?.disabled.value || undefined">
    <template v-if="context?.multiple.value">
      <span v-for="value in context.selectedValues.value" :key="value" class="stance-combobox__tag">
        {{ context.tagLabel(value) }}
        <button
          type="button"
          class="stance-combobox__tag-remove"
          :aria-label="`Remove ${context.tagLabel(value)}`"
          :disabled="context?.disabled.value"
          @click="removeTag(value)"
        >
          ×
        </button>
      </span>
    </template>
    <input
      :id="context?.inputId"
      ref="inputRef"
      v-bind="$attrs"
      type="text"
      role="combobox"
      autocomplete="off"
      class="stance-combobox__input"
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
  </div>
</template>

<style>
:where(.stance-combobox__input-wrapper) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--stance-spacing-xs, 0.25rem);
  width: 100%;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  padding: var(--stance-spacing-xs, 0.25rem) var(--stance-spacing-sm, 0.5rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  transition:
    border-color var(--stance-motion-duration, 0.15s) ease,
    outline-color var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-combobox__input-wrapper:focus-within) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
  border-color: var(--stance-color-ring);
}

:where(.stance-combobox__input-wrapper[data-disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.stance-combobox__input) {
  flex: 1 1 auto;
  min-width: 4rem;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding-block: var(--stance-spacing-xs, 0.25rem);
  font-family: inherit;
  font-size: var(--stance-text-base, 1rem);
  color: var(--stance-color-foreground);
}

:where(.stance-combobox__input::placeholder) {
  color: var(--stance-color-muted-foreground);
}

:where(.stance-combobox__input:disabled) {
  cursor: not-allowed;
}

:where(.stance-combobox__tag) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  padding: 0.125rem var(--stance-spacing-xs, 0.25rem) 0.125rem var(--stance-spacing-sm, 0.5rem);
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-secondary);
  color: var(--stance-color-secondary-foreground);
  font-size: var(--stance-text-sm, 0.875rem);
  line-height: 1.5;
}

:where(.stance-combobox__tag-remove) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1;
}

:where(.stance-combobox__tag-remove:hover) {
  background: var(--stance-color-secondary-hover);
}

:where(.stance-combobox__tag-remove:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-combobox__tag-remove:disabled) {
  cursor: not-allowed;
}
</style>
