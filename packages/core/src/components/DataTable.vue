<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
import { computed, provide, useId, watch } from "vue";
import { cn } from "../utils/cn";
import { RADIO_GROUP_KEY } from "../composables/useRadioGroup";
import { defaultCompare, useTableSort } from "../composables/useTableSort";
import { useTableFilters } from "../composables/useTableFilters";
import DataTablePagination from "./DataTablePagination.vue";
import SortHeaderButton from "./SortHeaderButton.vue";
import TableFilterToolbar from "./TableFilterToolbar.vue";
import Checkbox from "./Checkbox.vue";
import Radio from "./Radio.vue";
import { useLiveAnnouncer } from "../composables/useLiveAnnouncer";

export interface DataTableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique key. Used as the dynamic cell-slot name (`#cell-{key}`) and, unless `accessor` is given, to read `row[key]`. */
  key: string;
  header: string;
  sortable?: boolean;
  /** Reads the cell's value when the column doesn't map 1:1 to a row property (e.g. a derived/computed value). */
  accessor?: (row: T) => unknown;
  /** Overrides the default comparator when sorting this column client-side (ignored when `manualSort` is true). */
  sortFn?: (a: T, b: T) => number;
  /** @default "start" */
  align?: "start" | "center" | "end";
  /** Makes this column eligible for the global search and gives it its own filter control. @default false */
  filterable?: boolean;
  /** @default "text" unless `filterOptions` is given, in which case "select" */
  filterType?: DataTableFilterType;
  /** Renders the column's filter as a `<select>` of these values instead of a free-text "contains" input. */
  filterOptions?: string[];
}

export interface DataTableSortState {
  key: string;
  direction: "asc" | "desc";
}

export type DataTablePaginationMode = "client" | "server" | "none";

export type DataTableSelectionMode = "single" | "multiple" | "none";

export type DataTableFilterType = "text" | "select";

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Unique row identifier for stable `:key` bindings. */
  rowKey: keyof T | ((row: T) => string | number);
  /** v-model:sort. Null when no column is sorted. */
  sort?: DataTableSortState | null;
  /**
   * Skips DataTable's own client-side sorting of `rows` — the `sort` state
   * and header UI (click-to-cycle, `aria-sort`) still work normally, but
   * it's the consumer's responsibility to pass `rows` already in that order
   * (e.g. sorting happened server-side). @default false
   */
  manualSort?: boolean;
  loading?: boolean;
  /** Visually-hidden by default; gives the table an accessible name. */
  caption?: string;
  /**
   * @default "none" — renders all of `rows` with no pagination UI,
   * preserving the original rendering-and-sorting-only behavior.
   *
   * `"client"`: `rows` is the full dataset; DataTable slices it into pages
   * itself using `page`/`pageSize`.
   *
   * `"server"`: `rows` is assumed to already be just the current page (the
   * parent fetches per page); DataTable only renders the pagination UI and
   * emits `update:page` for the parent to react to.
   * Provide `totalRows` (or `totalPages` directly, which takes precedence)
   * so the page count and the "Showing rows…" announcement are correct.
   */
  paginationMode?: DataTablePaginationMode;
  /** v-model:page (1-indexed). @default 1 */
  page?: number;
  /**
   * Rows per page, combined with `page` to compute which rows to show in
   * client mode (and, in server mode, to compute `totalPages` from
   * `totalRows`). A plain prop, not a v-model — DataTable has no page-size
   * picker UI; the consumer owns this value entirely.
   * @default 10
   */
  pageSize?: number;
  /** Server mode: total row count across all pages, combined with `pageSize` to compute `totalPages` unless `totalPages` is given directly. */
  totalRows?: number;
  /** Server mode: total page count, if already known server-side (overrides the totalRows/pageSize calculation). */
  totalPages?: number;
  /** Where the pagination nav renders relative to the table. @default "bottom" */
  paginationPosition?: "top" | "bottom";
  /** Horizontal alignment of the pagination controls. @default "start" */
  paginationAlign?: "start" | "center" | "end";
  /** @default "none" */
  selectionMode?: DataTableSelectionMode;
  /**
   * v-model:selected — selected row *keys* (via `rowKey`), not full row
   * objects, so selection survives `rows` being replaced/refreshed instead
   * of pointing at stale objects. Always an array regardless of mode;
   * `selectionMode="single"` just constrains it to at most one entry.
   */
  selected?: Array<string | number>;
  /** v-model:globalFilter — free-text query matched against every `filterable` column. */
  globalFilter?: string;
  /** v-model:columnFilters — per-column filter values, keyed by column `key`. Absent/empty keys mean "no filter". */
  columnFilters?: Record<string, string>;
  /**
   * Skips DataTable's own client-side filtering of `rows` — the filter UI
   * and `globalFilter`/`columnFilters` state still work normally, but it's
   * the consumer's responsibility to pass `rows` already filtered (e.g.
   * filtering happened server-side, alongside `paginationMode="server"`).
   * @default false
   */
  manualFilter?: boolean;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  sort: null,
  manualSort: false,
  loading: false,
  paginationMode: "none",
  page: 1,
  pageSize: 10,
  paginationPosition: "bottom",
  paginationAlign: "start",
  selectionMode: "none",
  selected: () => [],
  globalFilter: "",
  columnFilters: () => ({}),
  manualFilter: false,
});

const emit = defineEmits<{
  "update:sort": [value: DataTableSortState | null];
  "update:page": [value: number];
  "update:selected": [value: Array<string | number>];
  "update:globalFilter": [value: string];
  "update:columnFilters": [value: Record<string, string>];
}>();

defineSlots<{
  /** Shown instead of rows when `rows` is empty and not `loading`. */
  empty?(): unknown;
  /** Shown instead of rows while `loading` is true. */
  loading?(): unknown;
  /** Shown instead of rows when filters remove every row from a non-empty dataset. */
  "no-results"?(): unknown;
  /** Per-column custom cell rendering, dynamically named `cell-{column.key}`. */
  [slotName: `cell-${string}`]: (scope: { row: T; value: unknown; rowIndex: number }) => unknown;
}>();

function cellValue(column: DataTableColumn<T>, row: T): unknown {
  return column.accessor ? column.accessor(row) : row[column.key as keyof T];
}

function getRowKey(row: T, index: number): string | number {
  if (typeof props.rowKey === "function") return props.rowKey(row);
  const value = row[props.rowKey];
  return typeof value === "string" || typeof value === "number" ? value : index;
}

const { announce } = useLiveAnnouncer();

const {
  filterableColumns,
  filterTypeFor,
  hasActiveFilters,
  columnFilterValue,
  setColumnFilter,
  globalFilterId,
  columnFilterId,
  announceResultCount,
} = useTableFilters({
  columns: () => props.columns,
  globalFilter: () => props.globalFilter,
  columnFilters: () => props.columnFilters,
  emitColumnFilters: (next) => emit("update:columnFilters", next),
});

// Filtering runs ahead of sorting, which runs ahead of pagination, so the
// three compose correctly: sort orders the filtered set, and pagination
// slices the filtered+sorted set (not the original `rows`).
const filteredRows = computed(() => {
  if (props.manualFilter) return props.rows;
  let result = props.rows;

  const query = props.globalFilter.trim().toLowerCase();
  if (query) {
    result = result.filter((row) =>
      filterableColumns.value.some((column) => String(cellValue(column, row) ?? "").toLowerCase().includes(query)),
    );
  }

  const activeColumnFilters = Object.entries(props.columnFilters).filter(([, value]) => value !== "");
  if (activeColumnFilters.length > 0) {
    result = result.filter((row) =>
      activeColumnFilters.every(([key, value]) => {
        const column = props.columns.find((c) => c.key === key);
        if (!column) return true;
        const cell = cellValue(column, row);
        if (filterTypeFor(column) === "select") return String(cell ?? "") === value;
        return String(cell ?? "")
          .toLowerCase()
          .includes(value.toLowerCase());
      }),
    );
  }

  return result;
});

const noResultsFromFilter = computed(
  () => props.rows.length > 0 && hasActiveFilters.value && filteredRows.value.length === 0,
);

watch(
  () => [props.globalFilter, props.columnFilters, filteredRows.value.length] as const,
  () => {
    if (!props.manualFilter) announceResultCount(filteredRows.value.length);
  },
);

const { toggleSort, ariaSortFor } = useTableSort<DataTableColumn<T>>(
  () => props.sort,
  (next) => emit("update:sort", next),
);

const sortedRows = computed(() => {
  const source = filteredRows.value;
  if (props.manualSort || !props.sort) return source;
  const sort = props.sort;
  const column = props.columns.find((c) => c.key === sort.key);
  if (!column) return source;
  const compare = column.sortFn ?? defaultCompare<T>((row) => cellValue(column, row));
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...source].sort((a, b) => compare(a, b) * factor);
});

const totalPagesComputed = computed(() => {
  if (props.paginationMode === "server") {
    if (props.totalPages !== undefined) return Math.max(1, props.totalPages);
    if (props.totalRows !== undefined) return Math.max(1, Math.ceil(props.totalRows / props.pageSize));
    return 1;
  }
  if (props.paginationMode === "client") {
    return Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize));
  }
  return 1;
});

// Clamped so an out-of-range `page` (e.g. the parent set it too high, or a
// future filter shrinks the result set below the current page) never tries
// to slice/display a page that doesn't exist.
const currentPage = computed(() => Math.min(Math.max(1, props.page), totalPagesComputed.value));

watch(
  currentPage,
  (clamped) => {
    if (props.paginationMode !== "none" && clamped !== props.page) emit("update:page", clamped);
  },
  { immediate: true },
);

const pagedRows = computed(() => {
  if (props.paginationMode !== "client") return sortedRows.value;
  const start = (currentPage.value - 1) * props.pageSize;
  return sortedRows.value.slice(start, start + props.pageSize);
});

const totalRowsForAnnouncement = computed(() => {
  if (props.paginationMode === "client") return sortedRows.value.length;
  return props.totalRows;
});

const rangeStart = computed(() => (currentPage.value - 1) * props.pageSize + 1);
const rangeEnd = computed(() => {
  const total = totalRowsForAnnouncement.value;
  const end = currentPage.value * props.pageSize;
  return total !== undefined ? Math.min(end, total) : end;
});

watch([currentPage, () => props.pageSize], () => {
  if (props.paginationMode === "none") return;
  const total = totalRowsForAnnouncement.value;
  announce(
    total !== undefined
      ? `Showing rows ${rangeStart.value}–${rangeEnd.value} of ${total}`
      : `Page ${currentPage.value} of ${totalPagesComputed.value}`,
  );
});

function goToPage(target: number) {
  const clamped = Math.min(Math.max(1, target), totalPagesComputed.value);
  emit("update:page", clamped);
}

/** Windowed page numbers around the current page, with "ellipsis" markers for gaps. */
const pageNumbers = computed<Array<number | "ellipsis">>(() => {
  const total = totalPagesComputed.value;
  const current = currentPage.value;
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  const range: Array<number | "ellipsis"> = [1];
  if (left > 2) range.push("ellipsis");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("ellipsis");
  if (total > 1) range.push(total);
  return range;
});

const selectedSet = computed(() => new Set(props.selected));

function isRowSelected(row: T, index: number): boolean {
  return selectedSet.value.has(getRowKey(row, index));
}

function setRowSelected(row: T, index: number, checked: boolean) {
  const key = getRowKey(row, index);
  if (props.selectionMode === "single") {
    emit("update:selected", checked ? [key] : []);
    return;
  }
  if (checked) {
    if (selectedSet.value.has(key)) return;
    emit("update:selected", [...props.selected, key]);
  } else {
    emit(
      "update:selected",
      props.selected.filter((k) => k !== key),
    );
  }
}

// "Select all" scope is the currently displayed (paged) rows, not the whole
// dataset — the header checkbox doesn't reach across pages, matching how
// most table implementations handle this by default.
const selectableRowKeys = computed(() => pagedRows.value.map((row, i) => getRowKey(row, i)));

const allRowsSelected = computed(
  () => selectableRowKeys.value.length > 0 && selectableRowKeys.value.every((k) => selectedSet.value.has(k)),
);
const someRowsSelected = computed(
  () => !allRowsSelected.value && selectableRowKeys.value.some((k) => selectedSet.value.has(k)),
);

function setAllRowsSelected(checked: boolean) {
  if (checked) {
    emit("update:selected", Array.from(new Set([...props.selected, ...selectableRowKeys.value])));
  } else {
    const removed = new Set(selectableRowKeys.value);
    emit(
      "update:selected",
      props.selected.filter((k) => !removed.has(k)),
    );
  }
}

// Radio needs an enclosing RadioGroup context (shared `name`, and the
// `updateValue` callback it calls on change) for single-select mode — but
// RadioGroup.vue itself renders its own wrapping <div>, which isn't valid
// markup inside a <tbody>/<tr>. Providing the same context contract
// directly lets <Radio> be used per-row without that wrapper.
const radioGroupName = useId();
provide(RADIO_GROUP_KEY, {
  name: computed(() => radioGroupName),
  modelValue: computed(() => (props.selected.length > 0 ? String(props.selected[0]) : undefined)),
  disabled: computed(() => false),
  required: computed(() => false),
  invalid: computed(() => false),
  describedBy: computed(() => undefined),
  updateValue: (value: string) => {
    const index = pagedRows.value.findIndex((row, i) => String(getRowKey(row, i)) === value);
    if (index !== -1) emit("update:selected", [getRowKey(pagedRows.value[index]!, index)]);
  },
});

const rootClass = computed(() => cn("stance-datatable", props.class));
</script>

<template>
  <div :class="rootClass">
    <TableFilterToolbar
      v-if="filterableColumns.length > 0"
      :columns="filterableColumns"
      :global-filter="props.globalFilter"
      :global-filter-id="globalFilterId"
      :column-filter-id="columnFilterId"
      :column-filter-value="columnFilterValue"
      :filter-type-for="filterTypeFor"
      @update:global-filter="(v) => emit('update:globalFilter', v)"
      @column-filter="(column, v) => setColumnFilter(column, v)"
    />

    <DataTablePagination
      v-if="paginationMode !== 'none' && paginationPosition === 'top'"
      :current-page="currentPage"
      :total-pages="totalPagesComputed"
      :page-numbers="pageNumbers"
      :align="props.paginationAlign"
      @go-to-page="goToPage"
    />

    <div class="stance-datatable__scroll">
      <table class="stance-datatable__table" role="table">
        <caption v-if="caption" class="stance-visually-hidden">{{ caption }}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th v-if="selectionMode !== 'none'" scope="col" role="columnheader" class="stance-datatable__select-cell">
              <Checkbox
                v-if="selectionMode === 'multiple'"
                :model-value="allRowsSelected"
                :indeterminate="someRowsSelected"
                @update:model-value="setAllRowsSelected"
              >
                <span class="stance-visually-hidden">Select all rows</span>
              </Checkbox>
              <span v-else class="stance-visually-hidden">Select</span>
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              role="columnheader"
              :aria-sort="ariaSortFor(column)"
              :data-align="column.align ?? 'start'"
            >
              <SortHeaderButton v-if="column.sortable" :sort="ariaSortFor(column)" @click="toggleSort(column)">
                {{ column.header }}
              </SortHeaderButton>
              <span v-else>{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr v-if="loading" role="row">
            <td :colspan="columns.length + (selectionMode !== 'none' ? 1 : 0)" role="cell" class="stance-datatable__status-cell">
              <slot name="loading">Loading…</slot>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0" role="row">
            <td :colspan="columns.length + (selectionMode !== 'none' ? 1 : 0)" role="cell" class="stance-datatable__status-cell">
              <slot name="empty">No data.</slot>
            </td>
          </tr>
          <tr v-else-if="noResultsFromFilter" role="row">
            <td :colspan="columns.length + (selectionMode !== 'none' ? 1 : 0)" role="cell" class="stance-datatable__status-cell">
              <slot name="no-results">No rows match your filters.</slot>
            </td>
          </tr>
          <tr v-for="(row, rowIndex) in loading || rows.length === 0 || noResultsFromFilter ? [] : pagedRows" :key="getRowKey(row, rowIndex)" role="row">
            <td v-if="selectionMode !== 'none'" role="cell" data-label="Select" class="stance-datatable__select-cell">
              <Checkbox
                v-if="selectionMode === 'multiple'"
                :model-value="isRowSelected(row, rowIndex)"
                @update:model-value="(checked) => setRowSelected(row, rowIndex, checked)"
              >
                <span class="stance-visually-hidden">Select row</span>
              </Checkbox>
              <Radio v-else :value="String(getRowKey(row, rowIndex))">
                <span class="stance-visually-hidden">Select row</span>
              </Radio>
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              role="cell"
              :data-label="column.header"
              :data-align="column.align ?? 'start'"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="cellValue(column, row)" :row-index="rowIndex">
                {{ cellValue(column, row) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <DataTablePagination
      v-if="paginationMode !== 'none' && paginationPosition === 'bottom'"
      :current-page="currentPage"
      :total-pages="totalPagesComputed"
      :page-numbers="pageNumbers"
      :align="props.paginationAlign"
      @go-to-page="goToPage"
    />
  </div>
</template>

<style>
:where(.stance-datatable) {
  container-type: inline-size;
  container-name: stance-datatable;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-datatable__scroll) {
  overflow-x: auto;
}

:where(.stance-datatable__table) {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--stance-text-sm, 0.875rem);
}

:where(.stance-datatable__select-cell) {
  width: 1%;
  white-space: nowrap;
  text-align: center;
}

:where(.stance-datatable__table th) {
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  border-bottom: 1px solid var(--stance-color-border);
  font-weight: var(--stance-font-weight-semibold, 600);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-datatable__table td) {
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  border-bottom: 1px solid var(--stance-color-border);
}

:where(.stance-datatable__table tbody tr:last-child td) {
  border-bottom: none;
}

:where(.stance-datatable__table [data-align="start"]) {
  text-align: start;
}
:where(.stance-datatable__table [data-align="center"]) {
  text-align: center;
}
:where(.stance-datatable__table [data-align="end"]) {
  text-align: end;
}

:where(.stance-datatable__status-cell) {
  padding: var(--stance-spacing-lg, 1rem);
  text-align: center;
  color: var(--stance-color-muted-foreground);
}

/* Below this container width, collapse the table to a stacked card per row.
   The real <thead> stays in the DOM (screen-reader-only) so the table's
   semantic header association survives for assistive tech regardless of
   the display change; data-label + generated content repeats each column's
   header visibly for sighted users. */
@container stance-datatable (max-width: 32rem) {
  :where(.stance-datatable__table),
  :where(.stance-datatable__table tbody),
  :where(.stance-datatable__table tr) {
    display: block;
    width: 100%;
  }

  :where(.stance-datatable__table thead) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  :where(.stance-datatable__table tbody tr) {
    margin-bottom: var(--stance-spacing-md, 0.75rem);
    border: 1px solid var(--stance-color-border);
    border-radius: var(--stance-radius-md, 0.5rem);
    padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  }

  :where(.stance-datatable__table tbody tr:last-child) {
    margin-bottom: 0;
  }

  /*
   * These come after the base [data-align] rules above, and both sides are
   * :where()-wrapped (specificity 0) — with a tie, source order decides, so
   * this correctly overrides per-column alignment for the collapsed layout
   * with no elevated-specificity escape hatch needed.
   */
  :where(.stance-datatable__table td) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--stance-spacing-md, 0.75rem);
    padding: var(--stance-spacing-xs, 0.25rem) 0;
    border-bottom: none;
    text-align: end;
  }

  :where(.stance-datatable__table td)::before {
    content: attr(data-label);
    font-weight: var(--stance-font-weight-medium, 500);
    color: var(--stance-color-muted-foreground);
    text-align: start;
  }

  :where(.stance-datatable__status-cell) {
    text-align: center;
  }

  :where(.stance-datatable__status-cell)::before {
    content: none;
  }
}
</style>
