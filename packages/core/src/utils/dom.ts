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
 *
 * SSR-safe: every caller invokes this unconditionally at the top of
 * `<script setup>` (so it runs during server rendering, e.g. under
 * VitePress/Nuxt), but every one of those overlays only teleports content
 * behind a client-only "open" state that's always `false` on first render —
 * so returning `undefined` here (and having the caller's `<Teleport
 * v-if="overlayRoot">` skip entirely) is correct, not a degraded fallback.
 * On the client, `document` always exists, so this always resolves to a
 * real element there, same as before.
 */
export function getOverlayRoot(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
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
