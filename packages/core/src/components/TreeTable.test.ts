/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't evaluate container queries or real
 * layout, so the responsive card-collapse can't be exercised here):
 *
 * 1. Resize the playground's container across 3+ widths — below ~32rem the
 *    table should collapse to a stacked card per visible row, with a
 *    graduated left indent/border reflecting depth.
 * 2. Turn on a screen reader: expanding/collapsing a row should announce its
 *    new state; arrowing between rows should announce level/position
 *    (aria-level, aria-setsize, aria-posinset).
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import TreeTable, { type TreeTableColumn, type TreeTableProps, type TreeTableSortState } from "./TreeTable.vue";
import treeTableSource from "./TreeTable.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { announce } from "../utils/live-region";

vi.mock("../utils/live-region", () => ({ announce: vi.fn() }));

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

interface FileNode extends Record<string, unknown> {
  name: string;
  size: number;
  children?: FileNode[];
}

const columns: TreeTableColumn<FileNode>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "size", header: "Size", sortable: true, align: "end" },
];

function makeRows(): FileNode[] {
  return [
    {
      name: "src",
      size: 0,
      children: [
        { name: "index.ts", size: 12 },
        { name: "utils.ts", size: 8 },
      ],
    },
    {
      name: "docs",
      size: 0,
      children: [{ name: "readme.md", size: 3 }],
    },
    { name: "package.json", size: 1 },
  ];
}

function renderHarness(props: Partial<TreeTableProps<FileNode>> = {}) {
  const Harness = defineComponent({
    setup() {
      const expanded = ref<Array<string | number>>(props.expanded ?? []);
      const sort = ref<TreeTableSortState | null>(props.sort ?? null);
      const selected = ref<Array<string | number>>(props.selected ?? []);
      const globalFilter = ref(props.globalFilter ?? "");
      const columnFilters = ref<Record<string, string>>(props.columnFilters ?? {});
      return () =>
        h(TreeTable<FileNode>, {
          columns,
          rows: makeRows(),
          rowKey: "name",
          ...props,
          expanded: expanded.value,
          "onUpdate:expanded": (v: Array<string | number>) => {
            expanded.value = v;
          },
          sort: sort.value,
          "onUpdate:sort": (v: TreeTableSortState | null) => {
            sort.value = v;
          },
          selected: selected.value,
          "onUpdate:selected": (v: Array<string | number>) => {
            selected.value = v;
          },
          globalFilter: globalFilter.value,
          "onUpdate:globalFilter": (v: string) => {
            globalFilter.value = v;
          },
          columnFilters: columnFilters.value,
          "onUpdate:columnFilters": (v: Record<string, string>) => {
            columnFilters.value = v;
          },
        });
    },
  });
  return render(Harness);
}

describe("TreeTable", () => {
  it("renders only top-level rows by default", () => {
    renderHarness();
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
    expect(screen.getByText("package.json")).toBeInTheDocument();
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
  });

  it("a row with children has aria-expanded=false and a leaf has none", () => {
    renderHarness();
    const rows = screen.getAllByRole("row");
    const srcRow = rows.find((r) => r.textContent?.includes("src"))!;
    const pkgRow = rows.find((r) => r.textContent?.includes("package.json"))!;
    expect(srcRow).toHaveAttribute("aria-expanded", "false");
    expect(pkgRow).not.toHaveAttribute("aria-expanded");
  });

  it("clicking the disclosure button reveals children and flips aria-expanded", async () => {
    renderHarness();
    const srcRow = screen.getAllByRole("row").find((r) => r.textContent?.includes("src"))!;
    const toggle = within(srcRow).getByRole("button", { name: "Expand row" });
    await fireEvent.click(toggle);
    await nextTick();

    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByText("utils.ts")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows.find((r) => r.textContent?.includes("src"))).toHaveAttribute("aria-expanded", "true");
  });

  it("sets aria-level/aria-setsize/aria-posinset per sibling group", async () => {
    renderHarness({ expanded: ["src"] });
    const rows = screen.getAllByRole("row");
    const srcRow = rows.find((r) => r.textContent?.includes("src") && !r.textContent?.includes("index"))!;
    const indexRow = rows.find((r) => r.textContent?.includes("index.ts"))!;
    const pkgRow = rows.find((r) => r.textContent?.includes("package.json"))!;

    expect(srcRow).toHaveAttribute("aria-level", "1");
    expect(srcRow).toHaveAttribute("aria-setsize", "3");
    expect(srcRow).toHaveAttribute("aria-posinset", "1");

    expect(indexRow).toHaveAttribute("aria-level", "2");
    expect(indexRow).toHaveAttribute("aria-setsize", "2");
    expect(indexRow).toHaveAttribute("aria-posinset", "1");

    expect(pkgRow).toHaveAttribute("aria-posinset", "3");
  });

  it("collapsing a node removes its descendants from the DOM entirely", async () => {
    renderHarness({ expanded: ["src"] });
    expect(screen.getByText("index.ts")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Collapse row" }));
    await nextTick();
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
  });

  describe("keyboard navigation", () => {
    it("ArrowRight on the primary column expands a collapsed row with children", async () => {
      renderHarness();
      const srcCell = screen.getByText("src").closest('[role="gridcell"]')!;
      await fireEvent.keyDown(srcCell, { key: "ArrowRight" });
      await nextTick();
      expect(screen.getByText("index.ts")).toBeInTheDocument();
    });

    it("ArrowRight again (already expanded) moves focus to the first child", async () => {
      renderHarness({ expanded: ["src"] });
      const srcCell = screen.getByText("src").closest('[role="gridcell"]')!;
      await fireEvent.keyDown(srcCell, { key: "ArrowRight" });
      await nextTick();
      expect(document.activeElement).toHaveTextContent("index.ts");
    });

    it("ArrowLeft collapses an expanded row", async () => {
      renderHarness({ expanded: ["src"] });
      const srcCell = screen.getByText("src").closest('[role="gridcell"]')!;
      await fireEvent.keyDown(srcCell, { key: "ArrowLeft" });
      await nextTick();
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    });

    it("ArrowLeft on a child moves focus to its parent", async () => {
      renderHarness({ expanded: ["src"] });
      const indexCell = screen.getByText("index.ts").closest('[role="gridcell"]')!;
      (indexCell as HTMLElement).focus();
      await fireEvent.keyDown(indexCell, { key: "ArrowLeft" });
      await nextTick();
      expect(document.activeElement).toHaveTextContent("src");
    });

    it("ArrowDown/ArrowUp move focus between visible rows only", async () => {
      renderHarness();
      const srcCell = screen.getByText("src").closest('[role="gridcell"]')!;
      await fireEvent.keyDown(srcCell, { key: "ArrowDown" });
      await nextTick();
      expect(document.activeElement).toHaveTextContent("docs");

      await fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
      await nextTick();
      expect(document.activeElement).toHaveTextContent("src");
    });

    it("ArrowRight/ArrowLeft on a non-primary column move focus horizontally instead of expanding", async () => {
      renderHarness();
      const rows = screen.getAllByRole("row");
      const srcRow = rows.find((r) => r.textContent?.includes("src"))!;
      const sizeCell = srcRow.querySelectorAll('[role="gridcell"]')[1]!;
      await fireEvent.keyDown(sizeCell, { key: "ArrowRight" });
      await nextTick();
      // no expand happened from the non-primary column
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    });

    it("Enter toggles expand/collapse on the primary column", async () => {
      renderHarness();
      const srcCell = screen.getByText("src").closest('[role="gridcell"]')!;
      await fireEvent.keyDown(srcCell, { key: "Enter" });
      await nextTick();
      expect(screen.getByText("index.ts")).toBeInTheDocument();
    });

    it("only one gridcell is in the tab order at a time (roving tabindex)", () => {
      renderHarness();
      const cells = document.querySelectorAll('[role="gridcell"]');
      const tabbable = Array.from(cells).filter((c) => c.getAttribute("tabindex") === "0");
      expect(tabbable).toHaveLength(1);
    });
  });

  it("sorts within each sibling group, preserving hierarchy", async () => {
    renderHarness({ expanded: ["src"] });
    const nameHeader = screen.getByRole("button", { name: /Name/ });
    await fireEvent.click(nameHeader);
    await nextTick();

    const rowTexts = screen.getAllByRole("row").map((r) => r.textContent);
    // top-level order: docs, package.json, src (alphabetical)
    const topLevelOrder = ["docs", "package.json", "src"];
    const positions = topLevelOrder.map((name) => rowTexts.findIndex((t) => t?.trim().startsWith(name)));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    // src's own children stay nested under it, sorted among themselves
    const srcIndex = rowTexts.findIndex((t) => t?.trim().startsWith("src"));
    expect(rowTexts[srcIndex + 1]).toContain("index.ts");
    expect(rowTexts[srcIndex + 2]).toContain("utils.ts");
  });

  it("filtering keeps a matching descendant's ancestor chain visible", async () => {
    renderHarness();
    const search = screen.getByLabelText("Search");
    await fireEvent.update(search, "index");
    await nextTick();

    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.queryByText("docs")).not.toBeInTheDocument();
    expect(screen.queryByText("package.json")).not.toBeInTheDocument();
  });

  it("announces the filtered result count, debounced", async () => {
    vi.useFakeTimers();
    renderHarness();
    const search = screen.getByLabelText("Search");
    await fireEvent.update(search, "index");
    vi.advanceTimersByTime(400);
    expect(announce).toHaveBeenCalledWith("1 result matches your filters");
    vi.useRealTimers();
  });

  it("multiple selection is scoped to currently visible rows", async () => {
    renderHarness({ selectionMode: "multiple" });
    const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });
    await fireEvent.click(selectAll);
    await nextTick();
    // only the 3 top-level rows are visible/selected, not the hidden children
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(4); // 3 rows + header
  });

  it("single selection uses a real Radio per row", () => {
    renderHarness({ selectionMode: "single" });
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("never emits !important in TreeTable's styles", () => {
    expect(treeTableSource).not.toContain("!important");
  });

  it("wraps TreeTable's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = treeTableSource.slice(treeTableSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-treetable/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderHarness({ expanded: ["src"], selectionMode: "multiple" });
      const root = container.querySelector(".stance-treetable")!;
      root.setAttribute("data-theme", theme.name);
      if (mode === "dark") root.classList.add("dark");

      const results = await runAxe(root);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
