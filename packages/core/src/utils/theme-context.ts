/**
 * Overlays teleport to a shared body-level root (see getOverlayRoot()),
 * which escapes whatever `[data-theme]`-scoped wrapper the triggering
 * element lives in. Real apps that theme at `<html>`/`<body>` (the "root-
 * level" setup CLAUDE.md describes) aren't affected, but anything scoping
 * theme to a sub-tree — including this library's own side-by-side
 * light/dark playground stories — needs the teleported content to inherit
 * that ambient context explicitly rather than silently losing every
 * --stance-* custom property.
 *
 * `from` should be the triggering element (e.g. `document.activeElement`
 * at the moment the overlay opens), which is still in its original DOM
 * location even though the overlay's own output isn't.
 */
export interface ThemeContext {
  theme: string | null;
  dark: boolean;
}

export function detectThemeContext(from: Element | null | undefined): ThemeContext {
  const themed = from?.closest("[data-theme]");
  if (!(themed instanceof HTMLElement)) {
    return { theme: null, dark: false };
  }
  return {
    theme: themed.getAttribute("data-theme"),
    dark: themed.classList.contains("dark"),
  };
}
