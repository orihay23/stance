import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Separator from "./Separator.vue";
import separatorSource from "./Separator.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Separator", () => {
  it("renders role=separator with aria-orientation=horizontal by default", () => {
    render(Separator);
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("sets data-orientation and aria-orientation to vertical", () => {
    render(Separator, { props: { orientation: "vertical" } });
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("data-orientation", "vertical");
    expect(el).toHaveAttribute("aria-orientation", "vertical");
  });

  it("decorative mode: aria-hidden and no role, for purely visual dividers", () => {
    const { container } = render(Separator, { props: { decorative: true } });
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).not.toHaveAttribute("role");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Separator, { props: { class: "my-4" } });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-separator");
    expect(root.className).toContain("my-4");
  });

  it("never emits !important in its styles", () => {
    expect(separatorSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = separatorSource.slice(separatorSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-separator/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Separator);
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
