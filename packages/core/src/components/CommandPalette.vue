<script setup lang="ts">
import { computed, onUnmounted, provide, reactive, useId, useTemplateRef, watch, watchEffect } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { useActiveDescendant } from "../composables/useActiveDescendant";
import { COMMAND_PALETTE_KEY, type CommandPaletteItemEntry } from "../composables/useCommandPalette";
import { useDismissable } from "../composables/useDismissable";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useLiveAnnouncer } from "../composables/useLiveAnnouncer";
import { useModalBackground } from "../composables/useModalBackground";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";

// Deliberately does NOT compose the public <Dialog> component, even though
// this is conceptually "Dialog + listbox machinery" per the design doc.
// Dialog requires a `title` that's always rendered as a visible <h2> — a
// command palette conventionally has no visible heading at all (the
// search input is the only visible chrome), just an aria-label. Rather
// than bend Dialog's contract (or worse, add a "hide the title" escape
// hatch to an already-shipped, tested component for one caller), this
// reuses the exact same underlying composables Dialog itself is built
// from — the established pattern here is components sharing composables,
// not wrapping each other, once their concrete markup/ARIA diverges
// enough (DropdownMenuContent and PopoverContent do the same with
// useFloatingOverlay/useDismissable/useFocusTrap rather than composing
// each other).
export interface CommandPaletteProps {
  /** v-model open state. */
  modelValue?: boolean;
  /** v-model:inputValue — the current typed filter text. Same "doesn't filter its own items" contract as Combobox (design doc, §1) — the consumer owns narrowing their own `CommandPaletteItem` list against this. */
  inputValue?: string;
  /**
   * Accessible name, wired via aria-label (not a visible heading — see
   * above). Required for the same reason Dialog's `title` is: a nameless
   * dialog is a real accessibility gap, not a cosmetic one.
   */
  label: string;
  placeholder?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the panel. */
  class?: string;
}

const props = withDefaults(defineProps<CommandPaletteProps>(), {
  modelValue: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:inputValue": [value: string];
}>();

defineSlots<{
  /** Expects `<CommandPaletteItem>`s. */
  default(): unknown;
  /** Shown when there are zero registered items. */
  empty?(): unknown;
}>();

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!props.label?.trim()) {
      console.error("[stance/CommandPalette] requires a non-empty `label` for accessibility.");
    }
  });
}

const { announce } = useLiveAnnouncer();

const open = computed(() => props.modelValue);
const inputValue = computed(() => props.inputValue ?? "");
const baseId = useId();
const listboxId = `${baseId}-listbox`;

const overlayRoot = getOverlayRoot();
const panelRef = useTemplateRef<HTMLElement>("panelRef");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

const themeContext = useOverlayThemeContext(open, () => document.activeElement);

useModalBackground(open, overlayRoot);

useFocusTrap({
  container: panelRef,
  active: open,
  initialFocus: inputRef,
});

// Escape closes the whole palette immediately, unlike Combobox's two-step
// "first clears text, second closes" — there's no separate popup/input
// distinction here to preserve; the palette IS the popup.
useDismissable({
  active: open,
  containers: [panelRef],
  onDismiss: () => emit("update:modelValue", false),
});

const itemsRegistry = reactive(new Map<string, CommandPaletteItemEntry>());
const itemIds = computed(() => Array.from(itemsRegistry.keys()));

function registerItem(entry: CommandPaletteItemEntry) {
  itemsRegistry.set(entry.id, entry);
}
function unregisterItem(id: string) {
  itemsRegistry.delete(id);
}

const activeDescendant = useActiveDescendant({
  itemIds,
  isDisabled: (id) => itemsRegistry.get(id)?.disabled ?? false,
});

function close() {
  emit("update:modelValue", false);
}

function onInput(event: Event) {
  emit("update:inputValue", (event.target as HTMLInputElement).value);
  activeDescendant.reset();
}

function commitActive() {
  const id = activeDescendant.activeId.value;
  if (!id) return;
  // Each CommandPaletteItem owns its own @select emit + close (mirroring
  // DropdownMenuItem's activate()), since items are typically distinct
  // actions with distinct handlers, not homogeneous "pick a value" the way
  // Combobox options are — so there's no single root-owned "select this
  // value" to call here. Routing through a real click reuses that item's
  // own disabled-check/emit/close in one code path instead of duplicating
  // it, the same way a browser translates Enter-on-a-focused-button into a
  // synthetic click.
  document.getElementById(id)?.click();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeDescendant.moveNext();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeDescendant.movePrev();
    // Home/End are deliberately NOT forwarded to activeDescendant here,
    // same reasoning as ComboboxInput — they need to stay native
    // text-cursor movement inside a text input.
  } else if (event.key === "Enter") {
    event.preventDefault();
    commitActive();
  }
}

// Debounced "N results available" — same pattern (and same reasoning for
// reimplementing rather than importing) as Combobox's own.
let announceTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => itemIds.value.length,
  (count) => {
    if (!open.value) return;
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announce(`${count} ${count === 1 ? "result" : "results"} available`);
    }, 400);
  },
);
onUnmounted(() => {
  if (announceTimer) clearTimeout(announceTimer);
});

provide(COMMAND_PALETTE_KEY, {
  open,
  close,
  inputValue,
  setInputValue: (value: string) => emit("update:inputValue", value),
  registerItem,
  unregisterItem,
  itemCount: computed(() => itemsRegistry.size),
  activeDescendant,
  listboxId,
});

const panelClass = computed(() => cn("stance-command-palette__panel", props.class));
</script>

<template>
  <Teleport v-if="overlayRoot" :to="overlayRoot">
    <div
      v-if="open"
      class="stance-command-palette__backdrop"
      :data-theme="themeContext.theme ?? undefined"
      :class="{ dark: themeContext.dark }"
    >
      <div ref="panelRef" :class="panelClass" role="dialog" aria-modal="true" :aria-label="label" tabindex="-1">
        <input
          ref="inputRef"
          type="text"
          role="combobox"
          autocomplete="off"
          class="stance-command-palette__input"
          :value="inputValue"
          :placeholder="placeholder"
          :aria-label="label"
          aria-autocomplete="list"
          aria-expanded="true"
          :aria-controls="listboxId"
          :aria-activedescendant="activeDescendant.activeId.value ?? undefined"
          @input="onInput"
          @keydown="onKeydown"
        />
        <div :id="listboxId" role="listbox" class="stance-command-palette__list">
          <slot />
          <p v-if="itemsRegistry.size === 0" class="stance-command-palette__empty">
            <slot name="empty">No results.</slot>
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
:where(.stance-command-palette__backdrop) {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--stance-spacing-lg, 1rem);
  padding-top: 12vh;
  background: var(--stance-color-overlay, rgb(0 0 0 / 0.5));
  pointer-events: auto;
}

:where(.stance-command-palette__panel) {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 36rem;
  max-height: min(28rem, calc(100vh - 16vh - 2rem));
  overflow: hidden;
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-lg, 0.75rem);
  box-shadow: var(--stance-shadow-lg);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-command-palette__panel:focus-visible) {
  outline: none;
}

:where(.stance-command-palette__input) {
  flex: none;
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--stance-color-border);
  outline: none;
  background: transparent;
  padding: var(--stance-spacing-md, 0.75rem) var(--stance-spacing-lg, 1rem);
  font-family: inherit;
  font-size: var(--stance-text-lg, 1.125rem);
  color: var(--stance-color-foreground);
}

:where(.stance-command-palette__input::placeholder) {
  color: var(--stance-color-muted-foreground);
}

:where(.stance-command-palette__list) {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow-y: auto;
  padding: var(--stance-spacing-xs, 0.25rem);
}

:where(.stance-command-palette__empty) {
  margin: 0;
  padding: var(--stance-spacing-sm, 0.5rem);
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}
</style>
