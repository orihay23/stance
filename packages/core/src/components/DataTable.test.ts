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
import { describe, expect, it, vi } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import DataTable, { type DataTableColumn, type DataTableProps, type DataTableSortState } from "./DataTable.vue";
import dataTableSource from "./DataTable.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

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

function renderHarness(props: Partial<DataTableProps<Person>> = {}, onSort?: (v: DataTableSortState | null) => void) {
  const Harness = defineComponent({
    setup() {
      const sort = ref<DataTableSortState | null>(props.sort ?? null);
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
        });
    },
  });
  return render(Harness);
}

function bodyRows() {
  return screen.getAllByRole("row").slice(1); // drop the header row
}

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
