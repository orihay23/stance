import type { InjectionKey, Ref } from "vue";
import { inject } from "vue";

export interface RadioGroupContext {
  /** Shared `name` so native radio inputs get free browser roving-tabindex + arrow-key nav. */
  name: Ref<string>;
  modelValue: Ref<string | undefined>;
  disabled: Ref<boolean>;
  required: Ref<boolean>;
  invalid: Ref<boolean>;
  describedBy: Ref<string | undefined>;
  updateValue: (value: string) => void;
}

export const RADIO_GROUP_KEY: InjectionKey<RadioGroupContext> = Symbol("RadioGroup");

/** Reads the enclosing RadioGroup's context; warns in dev mode if there isn't one. */
export function useRadioGroupContext(): RadioGroupContext | undefined {
  const context = inject(RADIO_GROUP_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error("[stance/Radio] must be used within a <RadioGroup>.");
  }
  return context;
}
