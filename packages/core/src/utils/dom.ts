const OVERLAY_ROOT_ID = "stance-overlay-root";

/**
 * Returns the shared portal target every overlay (Dialog, Popover, Tooltip,
 * Dropdown Menu) teleports into, creating it on first use.
 *
 * Stacking scheme: the root itself carries one fixed z-index for the whole
 * overlay layer; ordering *between* simultaneously-open overlays is handled
 * by DOM append order (later-opened overlays paint on top), not by
 * per-component z-index tiers. The root has `pointer-events: none` so empty
 * space doesn't block the page — each overlay re-enables pointer-events on
 * its own rendered root.
 */
export function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = OVERLAY_ROOT_ID;
    root.setAttribute("data-stance-overlay-root", "");
    document.body.appendChild(root);
  }
  return root;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

/** Focusable descendants of `container`, in DOM (tab) order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}
