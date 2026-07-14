/**
 * Overlays teleport to a shared body-level root (see getOverlayRoot()),
 * which escapes whatever `[data-theme]`/`[data-theme-palette]`/
 * `[data-theme-density]`-scoped wrapper the triggering element lives in.
 * Real apps that theme at `<html>`/`<body>` (the "root-level" setup
 * CLAUDE.md describes) aren't affected, but anything scoping theme to a
 * sub-tree — including this library's own side-by-side light/dark
 * playground stories — needs the teleported content to inherit that
 * ambient context explicitly rather than silently losing every --stance-*
 * custom property.
 *
 * `from` should be the triggering element (e.g. `document.activeElement`
 * at the moment the overlay opens), which is still in its original DOM
 * location even though the overlay's own output isn't.
 */
export interface ThemeContext {
  /** Legacy bundled `data-theme`. Still detected for full backward compat — see design-docs/theme-axes.md §3. */
  theme: string | null;
  /** Phase 14 `data-theme-palette` (see design-docs/theme-axes.md §2). */
  palette: string | null;
  /** Phase 14 `data-theme-density`. */
  density: string | null;
  dark: boolean;
}

// `x instanceof HTMLElement` still evaluates the bare `HTMLElement`
// identifier even when `x` is null/undefined — and `HTMLElement` isn't a
// global at all under Node SSR (no jsdom), so it throws a ReferenceError
// there instead of safely returning false the way `typeof` would. This
// wrapper is what makes detectThemeContext callable during SSR (every
// overlay component calls it eagerly at setup time via
// useOverlayThemeContext, whether or not it ever opens — see that file).
function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

export function detectThemeContext(from: Element | null | undefined): ThemeContext {
  const legacyThemed = from?.closest("[data-theme]");
  const paletteThemed = from?.closest("[data-theme-palette]");
  const densityThemed = from?.closest("[data-theme-density]");

  const theme = isHtmlElement(legacyThemed) ? legacyThemed.getAttribute("data-theme") : null;
  const palette = isHtmlElement(paletteThemed) ? paletteThemed.getAttribute("data-theme-palette") : null;
  const density = isHtmlElement(densityThemed) ? densityThemed.getAttribute("data-theme-density") : null;

  // Dark mode is a color-axis concern (theme-axes.md §1) — every existing
  // usage co-locates the `.dark` class on the same element as whichever
  // color-carrying attribute is present (`data-theme` today, or the new
  // `data-theme-palette`), matching how every story in this codebase
  // already writes `:data-theme="x" :class="{ dark }"` on one element.
  // The two are mutually exclusive in every current usage, so this
  // prioritization is only a tiebreak for the theoretical case where both
  // are present on different ancestors.
  const darkSource = legacyThemed ?? paletteThemed;
  const dark = isHtmlElement(darkSource) && darkSource.classList.contains("dark");

  return { theme, palette, density, dark };
}
