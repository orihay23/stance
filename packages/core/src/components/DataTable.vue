<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
import { computed } from "vue";
import { cn } from "../utils/cn";

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
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  sort: null,
  manualSort: false,
  loading: false,
});

const emit = defineEmits<{
  "update:sort": [value: DataTableSortState | null];
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
          <tr v-for="(row, rowIndex) in loading || rows.length === 0 ? [] : sortedRows" :key="getRowKey(row, rowIndex)" role="row">
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
