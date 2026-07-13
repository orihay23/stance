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
import DataTable, {
  type DataTableColumn,
  type DataTableProps,
  type DataTableSortState,
} from "./DataTable.vue";
import dataTableSource from "./DataTable.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { announce } from "../utils/live-region";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

vi.mock("../utils/live-region", () => ({ announce: vi.fn() }));

const modes = ["light", "dark"] as const;

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
  onSelected?: (v: Array<string | number>) => void,
  onGlobalFilter?: (v: string) => void,
  onColumnFilters?: (v: Record<string, string>) => void,
  onPageSize?: (v: number) => void,
) {
  const Harness = defineComponent({
    setup() {
      const sort = ref<DataTableSortState | null>(props.sort ?? null);
      const page = ref(props.page ?? 1);
      const pageSize = ref(props.pageSize ?? 10);
      const selected = ref<Array<string | number>>(props.selected ?? []);
      const globalFilter = ref(props.globalFilter ?? "");
      const columnFilters = ref<Record<string, string>>(props.columnFilters ?? {});
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
            onPageSize?.(v);
          },
          selected: selected.value,
          "onUpdate:selected": (v: Array<string | number>) => {
            selected.value = v;
            onSelected?.(v);
          },
          globalFilter: globalFilter.value,
          "onUpdate:globalFilter": (v: string) => {
            globalFilter.value = v;
            onGlobalFilter?.(v);
          },
          columnFilters: columnFilters.value,
          "onUpdate:columnFilters": (v: Record<string, string>) => {
            columnFilters.value = v;
            onColumnFilters?.(v);
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

  it("warns in dev mode when rowKey resolves to a non-primitive and falls back to the array index", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHarness({ rowKey: "missingField" as unknown as keyof Person });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to its array index"));
    warnSpy.mockRestore();
  });

  it("does not warn when rowKey resolves to a real primitive on every row", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHarness();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
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

    it("renders no page-size picker when pageSizeOptions is omitted", async () => {
      renderHarness({ rows: manyRows, paginationMode: "client", pageSize: 10 });
      await nextTick();
      expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
    });

    it("renders a page-size picker and emits update:pageSize (reusing the standalone Pagination component) when pageSizeOptions is given", async () => {
      const onPageSize = vi.fn();
      renderHarness(
        { rows: manyRows, paginationMode: "client", pageSize: 10, pageSizeOptions: [10, 25, 50] },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        onPageSize,
      );
      await nextTick();

      const select = screen.getByLabelText("Rows per page");
      await fireEvent.update(select, "25");
      expect(onPageSize).toHaveBeenCalledWith(25);
    });
  });

  describe("selection", () => {
    it("renders no selection column when selectionMode is 'none' (the default)", () => {
      renderHarness();
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    });

    it("multiple mode: renders a checkbox per row plus a header select-all checkbox", () => {
      renderHarness({ selectionMode: "multiple" });
      expect(screen.getAllByRole("checkbox", { name: "Select row" })).toHaveLength(3);
      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
    });

    it("multiple mode: checking a row's checkbox adds its row key to update:selected", async () => {
      const onSelected = vi.fn();
      renderHarness({ selectionMode: "multiple" }, undefined, undefined, onSelected);
      const [beaCheckbox] = screen.getAllByRole("checkbox", { name: "Select row" });
      await fireEvent.click(beaCheckbox!);
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith(["Bea"]);
    });

    it("multiple mode: unchecking a selected row removes its row key", async () => {
      const onSelected = vi.fn();
      renderHarness({ selectionMode: "multiple", selected: ["Bea", "Amir"] }, undefined, undefined, onSelected);
      const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
      await fireEvent.click(rowCheckboxes[0]!); // Bea
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith(["Amir"]);
    });

    it("multiple mode: header checkbox selects/deselects all currently displayed rows", async () => {
      const onSelected = vi.fn();
      renderHarness({ selectionMode: "multiple" }, undefined, undefined, onSelected);
      const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });

      await fireEvent.click(selectAll);
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith(["Bea", "Amir", "Cass"]);

      await fireEvent.click(selectAll);
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith([]);
    });

    it("multiple mode: header checkbox reflects checked/indeterminate state", async () => {
      renderHarness({ selectionMode: "multiple", selected: [] });
      const selectAll = screen.getByRole("checkbox", { name: "Select all rows" }) as HTMLInputElement;
      expect(selectAll.checked).toBe(false);
      expect(selectAll.indeterminate).toBe(false);

      const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
      await fireEvent.click(rowCheckboxes[0]!);
      await nextTick();
      expect(selectAll.indeterminate).toBe(true);
      expect(selectAll.checked).toBe(false);

      await fireEvent.click(rowCheckboxes[1]!);
      await fireEvent.click(rowCheckboxes[2]!);
      await nextTick();
      expect(selectAll.checked).toBe(true);
      expect(selectAll.indeterminate).toBe(false);
    });

    it("single mode: renders a radio per row and no header selection control", () => {
      renderHarness({ selectionMode: "single" });
      expect(screen.getAllByRole("radio")).toHaveLength(3);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("single mode: selecting a row replaces (not appends to) any previous selection", async () => {
      const onSelected = vi.fn();
      renderHarness({ selectionMode: "single" }, undefined, undefined, onSelected);
      const radios = screen.getAllByRole("radio", { name: "Select row" });

      await fireEvent.click(radios[0]!); // Bea
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith(["Bea"]);

      await fireEvent.click(radios[1]!); // Amir
      await nextTick();
      expect(onSelected).toHaveBeenLastCalledWith(["Amir"]);
      expect((radios[0] as HTMLInputElement).checked).toBe(false);
      expect((radios[1] as HTMLInputElement).checked).toBe(true);
    });

    it("keeps selection keyed by row identity across a sort change", async () => {
      const onSelected = vi.fn();
      renderHarness({ selectionMode: "multiple", selected: ["Bea"] }, undefined, undefined, onSelected);
      const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button");
      await fireEvent.click(nameButton); // sort by name asc: Amir, Bea, Cass
      await nextTick();

      const sortedRowLabels = bodyRows().map((r) => within(r).getAllByRole("cell")[1]!.textContent);
      expect(sortedRowLabels).toEqual(["Amir", "Bea", "Cass"]);
      const beaCheckbox = bodyRows()[1]!.querySelector("input[type=checkbox]") as HTMLInputElement;
      expect(beaCheckbox.checked).toBe(true);
    });

    it("puts the selection control before other interactive cell content in tab order", () => {
      renderHarness({ selectionMode: "multiple" });
      const firstDataRow = bodyRows()[0]!;
      const cells = within(firstDataRow).getAllByRole("cell");
      expect(within(cells[0]!).queryByRole("checkbox")).toBeInTheDocument();
    });

    it("accounts for the selection column in the empty/loading status row's colspan", () => {
      renderHarness({ selectionMode: "multiple", rows: [] });
      const statusCell = screen.getByText("No data.").closest("td")!;
      expect(statusCell).toHaveAttribute("colspan", "4"); // 3 columns + selection column
    });
  });

  describe("filtering", () => {
    const columnsWithFilters: DataTableColumn<Person>[] = [
      { key: "name", header: "Name", sortable: true, filterable: true },
      { key: "age", header: "Age", sortable: true, align: "end" },
      { key: "role", header: "Role", filterable: true, filterOptions: ["Engineer", "Designer", "Manager"] },
    ];

    beforeEach(() => {
      vi.mocked(announce).mockClear();
    });

    it("renders no filter UI when no column is filterable (the default)", () => {
      renderHarness();
      expect(screen.queryByRole("textbox", { name: "Search" })).not.toBeInTheDocument();
    });

    it("renders a labeled global search input when at least one column is filterable", () => {
      renderHarness({ columns: columnsWithFilters });
      expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
    });

    it("infers a text 'contains' filter by default and a select filter when filterOptions is given", () => {
      renderHarness({ columns: columnsWithFilters });
      expect(screen.getByLabelText("Name").tagName).toBe("INPUT");
      expect(screen.getByLabelText("Role").tagName).toBe("SELECT");
    });

    it("global search matches across all filterable columns, case-insensitively", async () => {
      renderHarness({ columns: columnsWithFilters, globalFilter: "eng" });
      await nextTick();
      const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
      expect(names).toEqual(["Bea"]); // only Bea's role ("Engineer") matches "eng"
    });

    it("global search does not match non-filterable columns", async () => {
      renderHarness({ columns: columnsWithFilters, globalFilter: "41" }); // Bea's age, not filterable
      await nextTick();
      expect(screen.getByText("No rows match your filters.")).toBeInTheDocument();
    });

    it("a per-column text filter narrows rows to matches for that column only", async () => {
      renderHarness({ columns: columnsWithFilters });
      const nameFilter = screen.getByLabelText("Name");
      await fireEvent.update(nameFilter, "am");
      await nextTick();
      const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
      expect(names).toEqual(["Amir"]);
    });

    it("a per-column select filter matches exactly", async () => {
      renderHarness({ columns: columnsWithFilters });
      const roleFilter = screen.getByLabelText("Role");
      await fireEvent.update(roleFilter, "Manager");
      await nextTick();
      const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
      expect(names).toEqual(["Cass"]);
    });

    it("composes global search and per-column filters together (AND, not OR)", async () => {
      renderHarness({ columns: columnsWithFilters, globalFilter: "a" }); // matches Amir, Cass by name/role text
      const roleFilter = screen.getByLabelText("Role");
      await fireEvent.update(roleFilter, "Manager");
      await nextTick();
      const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
      expect(names).toEqual(["Cass"]);
    });

    it("shows a no-results message (not the empty-dataset message) when filters remove every row", async () => {
      renderHarness({ columns: columnsWithFilters, globalFilter: "nobody-has-this-name" });
      await nextTick();
      expect(screen.getByText("No rows match your filters.")).toBeInTheDocument();
      expect(screen.queryByText("No data.")).not.toBeInTheDocument();
    });

    it("renders per-column filters inline (no disclosure) at 4 or fewer filterable columns", () => {
      renderHarness({ columns: columnsWithFilters });
      expect(screen.queryByRole("group", { name: "Filters" })).not.toBeInTheDocument();
      expect(screen.queryByText("Filters")).not.toBeInTheDocument();
    });

    it("collapses per-column filters into a 'Filters' disclosure past ~4 filterable columns", () => {
      const manyFilterableColumns: DataTableColumn<Person>[] = [
        { key: "name", header: "Name", filterable: true },
        { key: "age", header: "Age", filterable: true },
        { key: "role", header: "Role", filterable: true },
        { key: "extra1", header: "Extra 1", filterable: true, accessor: () => "" },
        { key: "extra2", header: "Extra 2", filterable: true, accessor: () => "" },
      ];
      const { container } = renderHarness({ columns: manyFilterableColumns });
      expect(container.querySelector("details.stance-table-column-filters")).toBeInTheDocument();
      expect(screen.getByText("Filters").tagName).toBe("SUMMARY");
    });

    it("does not filter client-side when manualFilter is true", async () => {
      renderHarness({ columns: columnsWithFilters, globalFilter: "am", manualFilter: true });
      await nextTick();
      expect(bodyRows()).toHaveLength(3); // all rows still shown; parent owns filtering
    });

    it("filtering, sorting, and pagination compose correctly together", async () => {
      const manyPeople: Person[] = Array.from({ length: 12 }, (_, i) => ({
        name: `Person ${String(i + 1).padStart(2, "0")}`,
        age: 20 + i,
        role: i % 3 === 0 ? "Manager" : "Engineer",
      }));
      renderHarness({
        columns: columnsWithFilters,
        rows: manyPeople,
        globalFilter: "Engineer", // 8 of 12 rows (excludes every 3rd)
        sort: { key: "name", direction: "desc" },
        paginationMode: "client",
        pageSize: 5,
      });
      await nextTick();
      // Filtered to 8 Engineers (every name not a multiple-of-3 index), sorted
      // by name desc, page 1 of 5 shows the 5 highest-numbered engineer names.
      const names = bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);
      expect(names).toEqual(["Person 12", "Person 11", "Person 09", "Person 08", "Person 06"]);
      expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument(); // ceil(8/5) = 2 pages
    });

    it("announces the filtered result count, debounced", async () => {
      vi.useFakeTimers();
      try {
        renderHarness({ columns: columnsWithFilters });
        const search = screen.getByRole("textbox", { name: "Search" });
        await fireEvent.update(search, "am");
        await vi.advanceTimersByTimeAsync(500);
        expect(announce).toHaveBeenCalledWith("1 result matches your filters");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("never emits !important in its styles", () => {
    expect(dataTableSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = dataTableSource.slice(dataTableSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-datatable/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = renderHarness({ caption: "Team roster" });
      const table = container.querySelector(".stance-datatable")!;
      table.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") table.classList.add("dark");

      const results = await runAxe(table);
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
    const { container } = renderHarness({ caption: "Team roster" });
    const table = container.querySelector(".stance-datatable")!;
    table.setAttribute("data-theme-palette", "neutral");
    table.setAttribute("data-theme-density", "compact");
    if (mode === "dark") table.classList.add("dark");

    const results = await runAxe(table);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
