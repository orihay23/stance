<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
import { computed, watch } from "vue";
import { cn } from "../utils/cn";
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
}

export interface DataTableSortState {
  key: string;
  direction: "asc" | "desc";
}

export type DataTablePaginationMode = "client" | "server" | "none";

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
   * emits `update:page`/`update:pageSize` for the parent to react to.
   * Provide `totalRows` (or `totalPages` directly, which takes precedence)
   * so the page count and the "Showing rows…" announcement are correct.
   */
  paginationMode?: DataTablePaginationMode;
  /** v-model:page (1-indexed). @default 1 */
  page?: number;
  /** v-model:pageSize. @default 10 */
  pageSize?: number;
  /** Server mode: total row count across all pages, combined with `pageSize` to compute `totalPages` unless `totalPages` is given directly. */
  totalRows?: number;
  /** Server mode: total page count, if already known server-side (overrides the totalRows/pageSize calculation). */
  totalPages?: number;
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
});

const emit = defineEmits<{
  "update:sort": [value: DataTableSortState | null];
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

defineSlots<{
  /** Shown instead of rows when `rows` is empty and not `loading`. */
  empty?(): unknown;
  /** Shown instead of rows while `loading` is true. */
  loading?(): unknown;
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

function defaultCompare(column: DataTableColumn<T>) {
  return (a: T, b: T) => {
    const av = cellValue(column, a);
    const bv = cellValue(column, b);
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    if (av instanceof Date && bv instanceof Date) return av.getTime() - bv.getTime();
    return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
  };
}

const sortedRows = computed(() => {
  if (props.manualSort || !props.sort) return props.rows;
  const sort = props.sort;
  const column = props.columns.find((c) => c.key === sort.key);
  if (!column) return props.rows;
  const compare = column.sortFn ?? defaultCompare(column);
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...props.rows].sort((a, b) => compare(a, b) * factor);
});

function toggleSort(column: DataTableColumn<T>) {
  if (!column.sortable) return;
  const current = props.sort;
  let next: DataTableSortState | null;
  if (!current || current.key !== column.key) {
    next = { key: column.key, direction: "asc" };
  } else if (current.direction === "asc") {
    next = { key: column.key, direction: "desc" };
  } else {
    next = null;
  }
  emit("update:sort", next);
}

function ariaSortFor(column: DataTableColumn<T>): "ascending" | "descending" | "none" | undefined {
  if (!column.sortable) return undefined;
  if (props.sort?.key !== column.key) return "none";
  return props.sort.direction === "asc" ? "ascending" : "descending";
}

const { announce } = useLiveAnnouncer();

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

const rootClass = computed(() => cn("stance-datatable", props.class));
</script>

<template>
  <div :class="rootClass">
    <div class="stance-datatable__scroll">
      <table class="stance-datatable__table" role="table">
        <caption v-if="caption" class="stance-datatable__caption">{{ caption }}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              role="columnheader"
              :aria-sort="ariaSortFor(column)"
              :data-align="column.align ?? 'start'"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="stance-datatable__sort-button"
                @click="toggleSort(column)"
              >
                <span>{{ column.header }}</span>
                <svg
                  class="stance-datatable__sort-icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  :data-direction="ariaSortFor(column)"
                >
                  <path
                    v-if="ariaSortFor(column) === 'ascending'"
                    d="M10 5l5 6H5z"
                    fill="currentColor"
                  />
                  <path
                    v-else-if="ariaSortFor(column) === 'descending'"
                    d="M10 15l-5-6h10z"
                    fill="currentColor"
                  />
                  <path
                    v-else
                    d="M10 4l4 5H6zM10 16l-4-5h8z"
                    fill="currentColor"
                    opacity="0.5"
                  />
                </svg>
              </button>
              <span v-else>{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr v-if="loading" role="row">
            <td :colspan="columns.length" role="cell" class="stance-datatable__status-cell">
              <slot name="loading">Loading…</slot>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0" role="row">
            <td :colspan="columns.length" role="cell" class="stance-datatable__status-cell">
              <slot name="empty">No data.</slot>
            </td>
          </tr>
          <tr v-for="(row, rowIndex) in loading || rows.length === 0 ? [] : pagedRows" :key="getRowKey(row, rowIndex)" role="row">
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

    <nav v-if="paginationMode !== 'none'" aria-label="Pagination" class="stance-datatable__pagination">
      <button
        type="button"
        class="stance-datatable__page-button stance-datatable__page-button--nav"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        Previous
      </button>

      <ul class="stance-datatable__page-list">
        <li v-for="(p, i) in pageNumbers" :key="i">
          <span v-if="p === 'ellipsis'" class="stance-datatable__page-ellipsis" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="stance-datatable__page-button"
            :aria-current="p === currentPage ? 'page' : undefined"
            :data-active="p === currentPage || undefined"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
        </li>
      </ul>

      <span class="stance-datatable__page-status">Page {{ currentPage }} of {{ totalPagesComputed }}</span>

      <button
        type="button"
        class="stance-datatable__page-button stance-datatable__page-button--nav"
        :disabled="currentPage >= totalPagesComputed"
        @click="goToPage(currentPage + 1)"
      >
        Next
      </button>
    </nav>
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

:where(.stance-datatable__caption) {
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

:where(.stance-datatable__sort-button) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;
}

:where(.stance-datatable__sort-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-datatable__sort-icon) {
  width: 0.875em;
  height: 0.875em;
  flex-shrink: 0;
}

:where(.stance-datatable__status-cell) {
  padding: var(--stance-spacing-lg, 1rem);
  text-align: center;
  color: var(--stance-color-muted-foreground);
}

:where(.stance-datatable__pagination) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-sm, 0.5rem);
  flex-wrap: wrap;
  padding-top: var(--stance-spacing-md, 0.75rem);
}

:where(.stance-datatable__page-list) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  list-style: none;
  margin: 0;
  padding: 0;
}

:where(.stance-datatable__page-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--stance-spacing-sm, 0.5rem);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: var(--stance-color-background);
  color: var(--stance-color-foreground);
  font: inherit;
  font-size: var(--stance-text-sm, 0.875rem);
  cursor: pointer;
}

:where(.stance-datatable__page-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-datatable__page-button:not(:disabled):hover) {
  background: var(--stance-color-muted);
}

:where(.stance-datatable__page-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-datatable__page-button[data-active]) {
  background: var(--stance-color-primary);
  border-color: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
}

:where(.stance-datatable__page-ellipsis) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  color: var(--stance-color-muted-foreground);
}

:where(.stance-datatable__page-status) {
  display: none;
  font-size: var(--stance-text-sm, 0.875rem);
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

  /* The numbered page list doesn't fit comfortably at this width — a plain
     "Page X of Y" status plus Previous/Next always fits regardless of how
     many total pages there are. */
  :where(.stance-datatable__page-list) {
    display: none;
  }

  :where(.stance-datatable__page-status) {
    display: inline-flex;
  }

  :where(.stance-datatable__pagination) {
    justify-content: space-between;
  }
}
</style>
