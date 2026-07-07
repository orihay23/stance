import type { ComputedRef, Ref } from "vue";
import { onBeforeUnmount, unref, watch } from "vue";
import { popBackgroundInert, pushBackgroundInert } from "../utils/inert-background";

/**
 * Toggles the shared background-inert lock (see utils/inert-background.ts)
 * alongside `open`, plus unmount cleanup — shared by Dialog (always active),
 * Popover (active only when `modal`), and DatePicker (always active, since
 * its calendar dialog uses the same WAI-ARIA Dialog framing as Popover's
 * `modal: true`).
 *
 * Must be called *before* `useFocusTrap` in the same component (as
 * Dialog/PopoverContent/DatePicker already do), so this watcher's
 * background-non-inert cleanup runs before useFocusTrap's own
 * restore-focus watcher — focusing an inert element silently fails.
 */
export function useModalBackground(
  open: Ref<boolean> | ComputedRef<boolean>,
  overlayRoot: HTMLElement | undefined,
  active: Ref<boolean> | ComputedRef<boolean> | boolean = true,
): void {
  const isActive = () => unref(active);

  watch(open, (isOpen) => {
    if (!isActive()) return;
    // overlayRoot is only undefined during SSR (see getOverlayRoot), where
    // `open` can never actually become true — real client renders always
    // have it by the time this watcher can fire.
    if (isOpen && overlayRoot) pushBackgroundInert(overlayRoot);
    else if (!isOpen) popBackgroundInert();
  });

  onBeforeUnmount(() => {
    if (unref(open) && isActive()) popBackgroundInert();
  });
}
