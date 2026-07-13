import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Skeleton from "./Skeleton.vue";
import skeletonSource from "./Skeleton.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Skeleton", () => {
  it("is aria-hidden with no role, by default", () => {
    const { container } = render(Skeleton);
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).not.toHaveAttribute("role");
  });

  it("defaults to the pulse variant", () => {
    const { container } = render(Skeleton);
    expect(container.firstElementChild).toHaveAttribute("data-variant", "pulse");
  });

  it("accepts the shimmer variant", () => {
    const { container } = render(Skeleton, { props: { variant: "shimmer" } });
    expect(container.firstElementChild).toHaveAttribute("data-variant", "shimmer");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Skeleton, { props: { class: "h-4 w-32" } });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-skeleton");
    expect(root.className).toContain("h-4");
    expect(root.className).toContain("w-32");
  });

  it("never emits !important in its styles", () => {
    expect(skeletonSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = skeletonSource.slice(skeletonSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-skeleton/m);
  });

  it("gates the shimmer/pulse animations behind prefers-reduced-motion: no-preference", () => {
    expect(skeletonSource).toContain("@media (prefers-reduced-motion: no-preference)");
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Skeleton, { props: { class: "h-4 w-32" } });
      container.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  // Targeted palette×density cross-check (design-docs/theme-axes.md §4/D4):
  // color contrast/ARIA don't vary by density, so this isn't a full matrix —
  // just one non-default density paired with the default palette, aimed at
  // catching a component that silently assumed color and density tokens
  // always change together.
  it.each(modes)("no axe violations: neutral palette + compact density (%s mode)", async (mode) => {
    const cleanup = withPaletteAndDensityStyle(neutralPalette, compactDensity);
    const { container } = render(Skeleton, { props: { class: "h-4 w-32" } });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
