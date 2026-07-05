/**
 * Manual responsive checklist (verify by hand in the playground, in
 * addition to the automated checks below — jsdom doesn't evaluate media or
 * container queries, so actual column-count switching can't be exercised
 * here):
 *
 * 1. In `responsiveMode="viewport"`, resize the browser window across the
 *    sm/md/lg/xl breakpoints — column count changes at each threshold
 *    regardless of the Grid's own width (e.g. even squeezed into a narrow
 *    sidebar column, it still counts the full viewport width).
 * 2. In `responsiveMode="container"`, place the same Grid inside a narrow
 *    parent (e.g. a sidebar) — column count now responds to the Grid's own
 *    rendered width, not the viewport, and can differ from a same-config
 *    viewport-mode Grid elsewhere on the same page.
 * 3. A `columns` config that skips a breakpoint (e.g. `{ base: 1, lg: 3 }`,
 *    no `sm`/`md`) still increases correctly at every threshold — it holds
 *    at 1 column through sm/md, then jumps to 3 at lg and stays there
 *    through xl.
 */
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Grid, { type GridGap, type GridResponsiveMode } from "./Grid.vue";
import gridSource from "./Grid.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Grid", () => {
  it("renders an outer container wrapping an inner grid element", () => {
    const { container } = render(Grid, { slots: { default: "Item" } });
    const outer = container.firstElementChild!;
    const inner = outer.querySelector(".stance-grid")!;
    expect(outer).toHaveClass("stance-grid-container");
    expect(inner).toBeInTheDocument();
    expect(screen.getByText("Item").closest(".stance-grid")).toBe(inner);
  });

  it("defaults to columns={ base: 1 }, exposed as a CSS custom property", () => {
    const { container } = render(Grid, { slots: { default: "Item" } });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.getPropertyValue("--stance-grid-cols-base")).toBe("1");
    expect(outer.style.getPropertyValue("--stance-grid-cols-sm")).toBe("");
  });

  it("exposes each configured breakpoint as its own CSS custom property", () => {
    const { container } = render(Grid, {
      props: { columns: { base: 1, md: 2, lg: 3 } },
      slots: { default: "Item" },
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.getPropertyValue("--stance-grid-cols-base")).toBe("1");
    expect(outer.style.getPropertyValue("--stance-grid-cols-md")).toBe("2");
    expect(outer.style.getPropertyValue("--stance-grid-cols-lg")).toBe("3");
    // sm/xl weren't configured — no property at all, so the CSS fallback
    // chain (not a "0" or empty value) is what determines the effective count.
    expect(outer.style.getPropertyValue("--stance-grid-cols-sm")).toBe("");
    expect(outer.style.getPropertyValue("--stance-grid-cols-xl")).toBe("");
  });

  it("defaults responsiveMode to 'container'", () => {
    const { container } = render(Grid, { slots: { default: "Item" } });
    expect(container.querySelector(".stance-grid")).toHaveAttribute("data-responsive-mode", "container");
  });

  it.each<GridResponsiveMode>(["container", "viewport"])("applies data-responsive-mode=%s", (responsiveMode) => {
    const { container } = render(Grid, { props: { responsiveMode }, slots: { default: "Item" } });
    expect(container.querySelector(".stance-grid")).toHaveAttribute("data-responsive-mode", responsiveMode);
  });

  it("defaults gap to 'md'", () => {
    const { container } = render(Grid, { slots: { default: "Item" } });
    expect(container.querySelector(".stance-grid")).toHaveAttribute("data-gap", "md");
  });

  it.each<GridGap>(["xs", "sm", "md", "lg", "xl"])("applies data-gap=%s", (gap) => {
    const { container } = render(Grid, { props: { gap }, slots: { default: "Item" } });
    expect(container.querySelector(".stance-grid")).toHaveAttribute("data-gap", gap);
  });

  it("renders arbitrary slot content (e.g. a row of Cards)", () => {
    render(Grid, { slots: { default: "<div>One</div><div>Two</div><div>Three</div>" } });
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("Three")).toBeInTheDocument();
  });

  it("merges a consumer class with the internal class list on the outer container", () => {
    const { container } = render(Grid, { props: { class: "mt-4" }, slots: { default: "Item" } });
    const outer = container.firstElementChild!;
    expect(outer.className).toContain("stance-grid-container");
    expect(outer.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(gridSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = gridSource.slice(gridSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-grid/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Grid, {
        props: { columns: { base: 1, sm: 2, lg: 3 } },
        slots: { default: "<div>One</div><div>Two</div><div>Three</div>" },
      });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
