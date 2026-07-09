import type { ComputedRef, InjectionKey } from "vue";
import { inject } from "vue";
import type { UseActiveDescendantResult } from "./useActiveDescendant";

export interface CommandPaletteItemEntry {
  id: string;
  label: string;
  disabled: boolean;
}

export interface CommandPaletteContext {
  open: ComputedRef<boolean>;
  close: () => void;
  inputValue: ComputedRef<string>;
  setInputValue: (value: string) => void;
  registerItem: (entry: CommandPaletteItemEntry) => void;
  unregisterItem: (id: string) => void;
  /** Count of currently-registered `CommandPaletteItem`s — drives the empty slot, same "real count, not slot presence" reasoning as Combobox's `optionCount`. */
  itemCount: ComputedRef<number>;
  activeDescendant: UseActiveDescendantResult;
  listboxId: string;
}

export const COMMAND_PALETTE_KEY: InjectionKey<CommandPaletteContext> = Symbol("CommandPalette");

/** Reads the enclosing CommandPalette's context; warns in dev mode if there isn't one. */
export function useCommandPaletteContext(componentName: string): CommandPaletteContext | undefined {
  const context = inject(COMMAND_PALETTE_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <CommandPalette>.`);
  }
  return context;
}
