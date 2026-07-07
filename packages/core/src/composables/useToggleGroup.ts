import type { InjectionKey, Ref } from "vue";
import { inject } from "vue";

/**
 * Single-select only for now — see the ToggleGroup design discussion.
 * Kept separate from useRadioGroup.ts (even though the underlying trick is
 * the same: a shared native radio `name` for free roving-tabindex/arrow-key
 * nav) so ToggleGroup/ToggleGroupItem aren't coupled to RadioGroup/Radio's
 * internal contract, which may evolve independently.
 */
export interface ToggleGroupContext {
  name: Ref<string>;
  modelValue: Ref<string | undefined>;
  disabled: Ref<boolean>;
  required: Ref<boolean>;
  invalid: Ref<boolean>;
  describedBy: Ref<string | undefined>;
  updateValue: (value: string) => void;
}

export const TOGGLE_GROUP_KEY: InjectionKey<ToggleGroupContext> = Symbol("ToggleGroup");

/** Reads the enclosing ToggleGroup's context; warns in dev mode if there isn't one. */
export function useToggleGroupContext(): ToggleGroupContext | undefined {
  const context = inject(TOGGLE_GROUP_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error("[stance/ToggleGroupItem] must be used within a <ToggleGroup>.");
  }
  return context;
}
