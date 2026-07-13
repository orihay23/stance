import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Pagination from "./Pagination.vue";
import paginationSource from "./Pagination.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Pagination", () => {
  it("wraps a real <nav aria-label='Pagination'>", () => {
    render(Pagination, { props: { page: 1, totalPages: 5 } });
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("marks the current page with aria-current=page", () => {
    render(Pagination, { props: { page: 3, totalPages: 5 } });
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).not.toHaveAttribute("aria-current");
  });

  it("disables Previous on the first page and Next on the last page", async () => {
    const { rerender } = render(Pagination, { props: { page: 1, totalPages: 5 } });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    await rerender({ page: 5, totalPages: 5 });
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("emits update:page (clamped) when Previous/Next/a page number is activated", async () => {
    const { emitted } = render(Pagination, { props: { page: 3, totalPages: 5 } });
    await fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(emitted()["update:page"]).toEqual([[4], [2], [1]]);
  });

  it("never emits a page below 1 or above totalPages", async () => {
    const { emitted } = render(Pagination, { props: { page: 1, totalPages: 1 } });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(emitted()["update:page"]).toBeUndefined();
  });

  it("windows page numbers with ellipsis markers for gaps", () => {
    const { container } = render(Pagination, { props: { page: 5, totalPages: 10 } });
    const list = container.querySelector(".stance-pagination__page-list")!;
    expect(list).toHaveTextContent("1…456…10");
    expect(container.querySelectorAll(".stance-pagination__page-ellipsis")).toHaveLength(2);
  });

  it("renders no page-size picker when pageSize/pageSizeOptions are omitted", () => {
    render(Pagination, { props: { page: 1, totalPages: 5 } });
    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
  });

  it("renders no page-size picker when only one of pageSize/pageSizeOptions is given", () => {
    render(Pagination, { props: { page: 1, totalPages: 5, pageSize: 10 } });
    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
  });

  it("renders no page-size picker when only pageSizeOptions is given", () => {
    render(Pagination, { props: { page: 1, totalPages: 5, pageSizeOptions: [10, 25, 50] } });
    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
  });

  it("renders a page-size picker with the given options when both props are given", () => {
    render(Pagination, { props: { page: 1, totalPages: 5, pageSize: 25, pageSizeOptions: [10, 25, 50] } });
    const select = screen.getByLabelText("Rows per page") as HTMLSelectElement;
    expect(select).toHaveValue("25");
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["10", "25", "50"]);
  });

  it("emits update:pageSize with a parsed number when the picker changes", async () => {
    const { emitted } = render(Pagination, {
      props: { page: 1, totalPages: 5, pageSize: 10, pageSizeOptions: [10, 25, 50] },
    });
    const select = screen.getByLabelText("Rows per page");
    await fireEvent.update(select, "50");
    expect(emitted()["update:pageSize"]).toEqual([[50]]);
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Pagination, { props: { page: 1, totalPages: 5, class: "mt-4" } });
    const root = container.querySelector("nav")!;
    expect(root.className).toContain("stance-pagination");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(paginationSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = paginationSource.slice(paginationSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-pagination/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Pagination, {
        props: { page: 3, totalPages: 10, pageSize: 25, pageSizeOptions: [10, 25, 50] },
      });
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
    const { container } = render(Pagination, {
      props: { page: 3, totalPages: 10, pageSize: 25, pageSizeOptions: [10, 25, 50] },
    });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
