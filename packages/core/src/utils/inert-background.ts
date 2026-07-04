/**
 * Makes everything outside the overlay root inert while a modal (Dialog) is
 * open — genuinely non-focusable/non-interactive via the `inert` attribute,
 * not just hidden from the accessibility tree the way `aria-hidden` alone
 * would leave it (a well-known gap: `aria-hidden` without `inert` still lets
 * keyboard Tab reach "hidden" content).
 *
 * Reference-counted so nested/stacked dialogs behave correctly: the
 * background is only restored once the last open dialog closes.
 */
let openCount = 0;
const previousState = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();

// Managed via the content attribute directly (setAttribute/hasAttribute)
// rather than the `.inert` IDL property. Real browsers reflect the two both
// ways, so this is equivalent there — but going through the attribute
// avoids depending on that reflection actually happening (and it's what
// makes this testable at all in jsdom, which doesn't implement `.inert`).
export function pushBackgroundInert(overlayRoot: HTMLElement): void {
  openCount += 1;
  if (openCount > 1) return;

  for (const child of Array.from(document.body.children)) {
    if (child === overlayRoot || !(child instanceof HTMLElement)) continue;
    previousState.set(child, { inert: child.hasAttribute("inert"), ariaHidden: child.getAttribute("aria-hidden") });
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

export function popBackgroundInert(): void {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;

  for (const [el, prev] of previousState) {
    if (prev.inert) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
    if (prev.ariaHidden === null) el.removeAttribute("aria-hidden");
    else el.setAttribute("aria-hidden", prev.ariaHidden);
  }
  previousState.clear();
}
