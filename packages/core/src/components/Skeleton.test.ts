import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Skeleton from "./Skeleton.vue";
import skeletonSource from "./Skeleton.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

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

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Skeleton, { props: { class: "h-4 w-32" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
