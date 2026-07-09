import type { Placement } from "@floating-ui/vue";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject } from "vue";
import type { UseActiveDescendantResult } from "./useActiveDescendant";

export interface ComboboxOptionEntry {
  id: string;
  value: string;
  label: string;
  disabled: boolean;
}

export interface ComboboxContext {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
  inputValue: ComputedRef<string>;
  setInputValue: (value: string) => void;
  multiple: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
  isSelected: (value: string) => boolean;
  /** Selects/toggles `value`. Single-select also closes the popup and fills the input with `label`; multi-select keeps the popup open and clears the input for the next filter term. */
  selectValue: (value: string, label: string) => void;
  /** Multi-select only: the currently-selected values, in selection order — the source `ComboboxInput` renders tags from and walks for Backspace-removes-last-tag. */
  selectedValues: ComputedRef<string[]>;
  /**
   * Resolves a selected value's display label for its tag, independent of
   * whether that `ComboboxOption` is currently mounted (options only exist
   * in the DOM while the popup is open — see the design doc, §3). Falls
   * back to the raw value if it's never been seen (e.g. a pre-populated
   * `modelValue` whose option hasn't rendered yet), the same graceful
   * degradation `ComboboxOption` itself uses when no `label` prop is given.
   */
  tagLabel: (value: string) => string;
  /** Commits whichever option `activeDescendant.activeId` currently points at, if any (Enter key). No-op if nothing is highlighted or it's disabled. */
  commitActive: () => void;
  registerOption: (entry: ComboboxOptionEntry) => void;
  unregisterOption: (id: string) => void;
  /** Count of currently-registered `ComboboxOption`s — the real "are there any results" signal, unlike checking whether the `default` slot was merely *passed* (it is, even when the consumer's own `v-for` renders zero items). */
  optionCount: ComputedRef<number>;
  activeDescendant: UseActiveDescendantResult;
  inputId: string;
  listboxId: string;
  /** The `<input>` element — doubles as the floating-ui anchor for `ComboboxContent`, registered via the shared `useOverlayTriggerRef`. */
  triggerRef: Ref<HTMLElement | null | undefined>;
  contentRef: Ref<HTMLElement | null | undefined>;
  placement: ComputedRef<Placement>;
  offset: ComputedRef<number>;
}

export const COMBOBOX_KEY: InjectionKey<ComboboxContext> = Symbol("Combobox");

/** Reads the enclosing Combobox's context; warns in dev mode if there isn't one. */
export function useComboboxContext(componentName: string): ComboboxContext | undefined {
  const context = inject(COMBOBOX_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <Combobox>.`);
  }
  return context;
}
