import type { ComputedRef } from "vue";
import { computed } from "vue";

export interface UseErrorSlotResult {
  /** id for the error message element, `${idBase}-error`. */
  errorId: ComputedRef<string>;
  /** True once `invalid` is set and the `error` slot actually has content. */
  showError: ComputedRef<boolean>;
  /** `errorId` while the error is shown, else `undefined` — wire straight to `aria-describedby`. */
  describedBy: ComputedRef<string | undefined>;
}

/**
 * Shared invalid/error-slot wiring used by every form control (Input,
 * Checkbox, Switch, Select, Textarea, RadioGroup, ToggleGroup): each
 * independently reimplemented the same errorId/showError/describedBy
 * computeds and trailing error `<p>`.
 */
export function useErrorSlot(idBase: () => string, invalid: () => boolean, hasErrorSlot: () => boolean): UseErrorSlotResult {
  const errorId = computed(() => `${idBase()}-error`);
  const showError = computed(() => invalid() && hasErrorSlot());
  const describedBy = computed(() => (showError.value ? errorId.value : undefined));

  return { errorId, showError, describedBy };
}
