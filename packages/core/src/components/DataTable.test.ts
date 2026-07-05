/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't evaluate container queries or real
 * layout, so the responsive card-collapse can't be exercised here):
 *
 * 1. Resize the playground's container across 3+ widths (wide, medium,
 *    below the collapse threshold) — the table should switch to a stacked
 *    card per row below ~32rem, with each value labelled by its column
 *    header.
 * 2. Turn on a screen reader at a collapsed width — column headers should
 *    still be announced for each cell (the real <thead> stays in the
 *    accessible tree, just visually hidden).
 * 3. Tab to a sortable column header — only the header's button should be
 *    focusable/operable, not the whole header cell.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import DataTable, { type DataTableColumn, type DataTableProps, type DataTableSortState } from "./DataTable.vue";
import dataTableSource from "./DataTable.vue?raw";
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

interface Person {
  name: string;
  age: number;
  role: string;
}

const columns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "role", header: "Role" },
];

const rows: Person[] = [
  { name: "Bea", age: 41, role: "Engineer" },
  { name: "Amir", age: 29, role: "Designer" },
  { name: "Cass", age: 35, role: "Manager" },
];

function renderHarness(
  props: Partial<DataTableProps<Person>> = {},
  onSort?: (v: DataTableSortState | null) => void,
  onPage?: (v: number) => void,
) {
  const Harness = defineComponent({
    setup() {
      const sort = ref<DataTableSortState | null>(props.sort ?? null);
      const page = ref(props.page ?? 1);
      const pageSize = ref(props.pageSize ?? 10);
      return () =>
        h(DataTable<Person>, {
          columns,
          rows,
          rowKey: "name",
          ...props,
          sort: sort.value,
          "onUpdate:sort": (v: DataTableSortState | null) => {
            sort.value = v;
            onSort?.(v);
          },
          page: page.value,
          "onUpdate:page": (v: number) => {
            page.value = v;
            onPage?.(v);
          },
          pageSize: pageSize.value,
          "onUpdate:pageSize": (v: number) => {
            pageSize.value = v;
          },
        });
    },
  });
  return render(Harness);
}

function bodyRows() {
  return screen.getAllByRole("row").slice(1); // drop the header row
}

const manyRows: Person[] = Array.from({ length: 25 }, (_, i) => ({
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  age: 20 + i,
  role: "Engineer",
}));

describe("DataTable", () => {
  it("renders semantic table markup with explicit roles", () => {
    renderHarness();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(screen.getAllByRole("cell")).toHaveLength(9);
  });

  it("gives sortable columns a real <button> in the header, not a bare click handler", () => {
    renderHarness();
    const nameHeader = screen.getByRole("columnheader", { name: /Name/ });
    expect(within(nameHeader).getByRole("button")).toBeInTheDocument();

    const roleHeader = screen.getByRole("columnheader", { name: /Role/ });
    expect(within(roleHeader).queryByRole("button")).not.toBeInTheDocument();
  });

  it("defaults aria-sort to none for sortable columns and omits it for non-sortable ones", () => {
    renderHarness();
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: /Role/ })).not.toHaveAttribute("aria-sort");
  });

  it("cycles a column's sort asc -> desc -> none on repeated clicks", async () => {
    const onSort = vi.fn();
    renderHarness({}, onSort);
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button");

    await fireEvent.click(nameButton);
    await nextTick();
    expect(onSort).toHaveBeenLastCalledWith({ key: "name", direction: "asc" });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending");

    await fireEvent.click(nameButton);
    await nextTick();
    expect(onSort).toHaveBeenLastCalledWith({ key: "name", direction: "desc" });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "descending");

    await fireEvent.click(nameButton);
    await nextTick();
    expect(onSort).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
  });

  it("switching to a different column resets to ascending, one column at a time", async () => {
    const onSort = vi.fn();
    renderHarness({}, onSort);
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button");
    const ageButton = within(screen.getByRole("columnheader", { name: /Age/ })).getByRole("button");

    await fireEvent.click(nameButton);
    await nextTick();
    await fireEvent.click(ageButton);
    await nextTick();

    expect(onSort).toHaveBeenLastCalledWith({ key: "age", direction: "asc" });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: /Age/ })).toHaveAttribute("aria-sort", "ascending");
  });

  it("sorts rows client-side by the current sort state", async () => {
    renderHarness({ sort: { key: "name", direction: "asc" } });
    await nextTick();
    const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
    expect(names).toEqual(["Amir", "Bea", "Cass"]);
  });

  it("sorts numerically for numeric columns, not lexicographically", async () => {
    renderHarness({ sort: { key: "age", direction: "asc" } });
    await nextTick();
    const ages = bodyRows().map((r) => within(r).getAllByRole("cell")[1]!.textContent);
    expect(ages).toEqual(["29", "35", "41"]);
  });

  it("does not re-sort rows itself when manualSort is true", async () => {
    renderHarness({ sort: { key: "name", direction: "asc" }, manualSort: true });
    await nextTick();
    const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
    expect(names).toEqual(["Bea", "Amir", "Cass"]); // original row order, unsorted
  });

  it("uses a column's custom sortFn instead of the default comparator", async () => {
    const roleOrder = ["Manager", "Engineer", "Designer"];
    const customColumns: DataTableColumn<Person>[] = [
      ...columns.slice(0, 2),
      {
        key: "role",
        header: "Role",
        sortable: true,
        sortFn: (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
      },
    ];
    renderHarness({ columns: customColumns, sort: { key: "role", direction: "asc" } });
    await nextTick();
    const roles = bodyRows().map((r) => within(r).getAllByRole("cell")[2]!.textContent);
    expect(roles).toEqual(["Manager", "Engineer", "Designer"]);
  });

  it("renders a custom cell via the dynamic #cell-{key} slot", () => {
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            DataTable<Person>,
            { columns, rows, rowKey: "name" },
            {
              "cell-name": (scope: { row: Person }) => h("strong", `Ms. ${scope.row.name}`),
            },
          );
      },
    });
    render(Harness);
    expect(screen.getByText("Ms. Bea")).toBeInTheDocument();
  });

  it("shows the empty slot (or default text) when rows is empty and not loading", () => {
    renderHarness({ rows: [] });
    expect(screen.getByText("No data.")).toBeInTheDocument();
  });

  it("shows the loading slot (or default text) while loading, even with rows present", () => {
    renderHarness({ loading: true });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Bea")).not.toBeInTheDocument();
  });

  it("renders a visually-hidden caption when given", () => {
    const { container } = renderHarness({ caption: "Team roster" });
    const caption = container.querySelector("caption");
    expect(caption).toHaveTextContent("Team roster");
  });

  describe("pagination", () => {
    beforeEach(() => {
      vi.mocked(announce).mockClear();
    });

    it("renders no pagination nav when paginationMode is 'none' (the default)", () => {
      renderHarness();
      expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    });

    it("client mode: slices rows into pages and shows all rows when paginationMode is 'none'", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      expect(bodyRows()).toHaveLength(10);
      expect(screen.getByText("Person 01")).toBeInTheDocument();
      expect(screen.queryByText("Person 11")).not.toBeInTheDocument();
    });

    it("client mode: Next/Previous navigate pages and disable at the boundaries", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();

      const prev = screen.getByRole("button", { name: "Previous" });
      const next = screen.getByRole("button", { name: "Next" });
      expect(prev).toBeDisabled();
      expect(next).not.toBeDisabled();

      await fireEvent.click(next);
      await nextTick();
      expect(screen.getByText("Person 11")).toBeInTheDocument();
      expect(prev).not.toBeDisabled();

      await fireEvent.click(next);
      await nextTick();
      expect(screen.getByText("Person 21")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 rows on the last page
      expect(next).toBeDisabled();
    });

    it("marks the active page button with aria-current=page", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", { name: "2" })).not.toHaveAttribute("aria-current");

      await fireEvent.click(screen.getByRole("button", { name: "2" }));
      await nextTick();
      expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    });

    it("wraps the pagination controls in a real <nav aria-label='Pagination'>", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      const nav = screen.getByRole("navigation", { name: "Pagination" });
      expect(nav.tagName).toBe("NAV");
    });

    it("server mode: renders only the given rows and derives totalPages from totalRows", async () => {
      const serverPage = manyRows.slice(0, 10);
      renderHarness({ rows: serverPage, paginationMode: "server", pageSize: 10, totalRows: 25 });
      await nextTick();
      expect(bodyRows()).toHaveLength(10);
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument(); // ceil(25/10) = 3 pages
    });

    it("server mode: totalPages prop overrides the totalRows/pageSize calculation when given", async () => {
      renderHarness({ rows: manyRows.slice(0, 10), paginationMode: "server", pageSize: 10, totalRows: 25, totalPages: 7 });
      await nextTick();
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
    });

    it("clamps and corrects an out-of-range page via update:page", async () => {
      const onPage = vi.fn();
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10, page: 99 }, undefined, onPage);
      await nextTick();
      expect(onPage).toHaveBeenCalledWith(3); // clamped to the last real page
    });

    it("announces the visible row range on page change", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      await fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await nextTick();
      expect(announce).toHaveBeenCalledWith("Showing rows 11–20 of 25");
    });

    it("announces by page number alone when the total row count isn't known (server mode without totalRows)", async () => {
      renderHarness({ rows: manyRows.slice(0, 10), paginationMode: "server", pageSize: 10, totalPages: 5 });
      await nextTick();
      await fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await nextTick();
      expect(announce).toHaveBeenCalledWith("Page 2 of 5");
    });

    it("renders the nav after the table by default (paginationPosition='bottom')", async () => {
      const { container } = renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      const children = Array.from(container.querySelector(".stance-datatable")!.children);
      const scrollIndex = children.findIndex((el) => el.classList.contains("stance-datatable__scroll"));
      const navIndex = children.findIndex((el) => el.tagName === "NAV");
      expect(scrollIndex).toBeGreaterThanOrEqual(0);
      expect(navIndex).toBeGreaterThan(scrollIndex);
    });

    it("renders the nav before the table when paginationPosition is 'top'", async () => {
      const { container } = renderHarness({
        rows: manyRows,
        paginationMode: "client",
        pageSize: 10,
        paginationPosition: "top",
      });
      await nextTick();
      const children = Array.from(container.querySelector(".stance-datatable")!.children);
      const scrollIndex = children.findIndex((el) => el.classList.contains("stance-datatable__scroll"));
      const navIndex = children.findIndex((el) => el.tagName === "NAV");
      expect(navIndex).toBeGreaterThanOrEqual(0);
      expect(navIndex).toBeLessThan(scrollIndex);
    });

    it("only renders one pagination nav regardless of position", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10, paginationPosition: "top" });
      await nextTick();
      expect(screen.getAllByRole("navigation", { name: "Pagination" })).toHaveLength(1);
    });

    it("applies the requested alignment via data-align, defaulting to 'start'", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveAttribute("data-align", "start");
    });

    it("applies a custom paginationAlign", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10, paginationAlign: "end" });
      await nextTick();
      expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveAttribute("data-align", "end");
    });
  });

  it("never emits !important in its styles", () => {
    expect(dataTableSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = dataTableSource.slice(dataTableSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-datatable/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderHarness({ caption: "Team roster" });
      const table = container.querySelector(".stance-datatable")!;
      table.setAttribute("data-theme", theme.name);
      if (mode === "dark") table.classList.add("dark");

      const results = await runAxe(table);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
