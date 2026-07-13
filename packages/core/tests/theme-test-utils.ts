import { allDensityProfiles, allPalettes, compileDensity, compilePalette, type ColorPalette, type DensityProfile } from "@stance/themes";

/**
 * The palette-axis counterpart of the old `allThemes` used by every
 * component's `describe.each(themes)` axe block (design-docs/theme-axes.md
 * §4/D4) — same 4 entries, same order, just palette-only (no density) since
 * color contrast/ARIA are what these tests actually check.
 */
export const palettes: readonly ColorPalette[] = allPalettes;

export const neutralPalette: ColorPalette = allPalettes.find((p) => p.name === "neutral")!;

/**
 * The one non-default density §4/D4 asks every component to pair with the
 * default palette, as a targeted check for "assumed color and density
 * tokens always change together" bugs — not part of the full matrix.
 */
export const compactDensity: DensityProfile = allDensityProfiles.find((d) => d.name === "compact")!;

/** Injects only a palette's color custom properties, scoped under `[data-theme-palette]`. */
export function withPaletteStyle(palette: ColorPalette): () => void {
  const style = document.createElement("style");
  style.textContent = compilePalette(palette);
  document.head.appendChild(style);
  return () => style.remove();
}

/**
 * Injects both a palette's and a density profile's custom properties
 * together, scoped under their respective `[data-theme-palette]`/
 * `[data-theme-density]` attributes — for the one targeted cross-check
 * §4/D4 adds per component.
 */
export function withPaletteAndDensityStyle(palette: ColorPalette, density: DensityProfile): () => void {
  const style = document.createElement("style");
  style.textContent = [compilePalette(palette), compileDensity(density)].join("\n\n");
  document.head.appendChild(style);
  return () => style.remove();
}
