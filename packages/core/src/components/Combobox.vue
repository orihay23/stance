<script setup lang="ts">
import type { Placement } from "@floating-ui/vue";
import { computed, onUnmounted, provide, reactive, ref, useId, watch } from "vue";
import { useActiveDescendant } from "../composables/useActiveDescendant";
import { COMBOBOX_KEY, type ComboboxOptionEntry } from "../composables/useCombobox";
import { useLiveAnnouncer } from "../composables/useLiveAnnouncer";

export interface ComboboxProps {
  /**
   * v-model — selected value(s). A `string` (or `undefined` for none) when
   * `multiple` is false (default); a `string[]` when true. Kept as a plain
   * union rather than discriminated by `multiple`, same reasoning as
   * Accordion's `modelValue`.
   */
  modelValue?: string | string[] | undefined;
  /**
   * v-model:inputValue — the current typed filter text, and also what the
   * input displays at rest. Combobox does not filter its own options (see
   * the Phase 12 design doc, §1) — the consumer owns narrowing their own
   * `ComboboxOption` list against this, sync or async alike. It also
   * doesn't infer display text from `modelValue`: a `ComboboxOption`'s
   * label is only knowable while that option is actually rendered (which,
   * for the popup's contents, means "open"), so a pre-selected
   * `modelValue` needs its matching label seeded into `inputValue` too —
   * same as seeding any other v-model'd text input's initial value.
   */
  inputValue?: string;
  /** @default false */
  multiple?: boolean;
  disabled?: boolean;
  /** @default "bottom-start" */
  placement?: Placement;
  /** Gap in pixels between the input and the popup. @default 4 */
  offset?: number;
}

const props = withDefaults(defineProps<ComboboxProps>(), {
  multiple: false,
  disabled: false,
  placement: "bottom-start",
  offset: 4,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | undefined];
  "update:inputValue": [value: string];
}>();

defineSlots<{
  /** Expects a `<ComboboxInput>` and a `<ComboboxContent>`. */
  default(): unknown;
}>();

const { announce } = useLiveAnnouncer();

const baseId = useId();
const open = ref(false);
const triggerRef = ref<HTMLElement | null | undefined>(null);
const contentRef = ref<HTMLElement | null | undefined>(null);

const optionsRegistry = reactive(new Map<string, ComboboxOptionEntry>());
const optionIds = computed(() => Array.from(optionsRegistry.keys()));

// Multi-select tags need a selected value's label even when its
// ComboboxOption isn't currently mounted (options only exist in the DOM
// while the popup is open) — this cache captures a value's label the
// moment it's selected (see selectValue below) or, failing that, the
// moment a matching option happens to register, and simply keeps it for
// as long as the value stays selected. Stale entries for values
// deselected from outside (a consumer mutating modelValue directly rather
// than through selectValue) are harmless — tags only ever render for
// values actually present in modelValue.
const selectedLabels = reactive(new Map<string, string>());
const selectedValues = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []));

function tagLabel(value: string): string {
  return selectedLabels.get(value) ?? value;
}

function registerOption(entry: ComboboxOptionEntry) {
  optionsRegistry.set(entry.id, entry);
  if (props.multiple && selectedValues.value.includes(entry.value)) {
    selectedLabels.set(entry.value, entry.label);
  }
}
function unregisterOption(id: string) {
  optionsRegistry.delete(id);
}

const activeDescendant = useActiveDescendant({
  itemIds: optionIds,
  isDisabled: (id) => optionsRegistry.get(id)?.disabled ?? false,
});

function isSelected(value: string): boolean {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  }
  return props.modelValue === value;
}

function selectValue(value: string, label: string) {
  if (props.multiple) {
    const current = selectedValues.value;
    const wasSelected = current.includes(value);
    const next = wasSelected ? current.filter((v) => v !== value) : [...current, value];
    if (wasSelected) {
      selectedLabels.delete(value);
    } else {
      selectedLabels.set(value, label);
    }
    emit("update:modelValue", next);
    emit("update:inputValue", "");
    announce(`${label} ${wasSelected ? "removed" : "added"}. ${next.length} selected.`);
  } else {
    emit("update:modelValue", value);
    emit("update:inputValue", label);
    open.value = false;
    activeDescendant.reset();
  }
}

function commitActive() {
  const id = activeDescendant.activeId.value;
  if (!id) return;
  const entry = optionsRegistry.get(id);
  if (!entry || entry.disabled) return;
  selectValue(entry.value, entry.label);
}

// Debounced "N options available" — same 400ms pattern useTableFilters
// uses for DataTable/TreeTable's filter-result announcements, reimplemented
// locally rather than imported: useTableFilters is column/table-filter
// shaped (filterableColumns, columnFilterId, ...), none of which applies
// here. Announces on every registered-option-count change while the popup
// is open, since that's the signal a screen reader user can't otherwise
// get (the listbox itself isn't focused — the input is).
let announceTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => optionIds.value.length,
  (count) => {
    if (!open.value) return;
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announce(`${count} ${count === 1 ? "option" : "options"} available`);
    }, 400);
  },
);
onUnmounted(() => {
  if (announceTimer) clearTimeout(announceTimer);
});

provide(COMBOBOX_KEY, {
  open,
  setOpen: (value: boolean) => {
    open.value = value;
    if (!value) activeDescendant.reset();
  },
  inputValue: computed(() => props.inputValue ?? ""),
  setInputValue: (value: string) => emit("update:inputValue", value),
  multiple: computed(() => props.multiple),
  disabled: computed(() => props.disabled),
  isSelected,
  selectValue,
  selectedValues,
  tagLabel,
  commitActive,
  registerOption,
  unregisterOption,
  optionCount: computed(() => optionsRegistry.size),
  activeDescendant,
  inputId: `${baseId}-input`,
  listboxId: `${baseId}-listbox`,
  triggerRef,
  contentRef,
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
});
</script>

<template>
  <slot />
</template>
