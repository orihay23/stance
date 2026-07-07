<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
import { computed, nextTick, ref, provide, useId, watch } from "vue";
import { cn } from "../utils/cn";
import { collectExpandableKeys, filterTree, flattenVisibleTree, sortTree, type FlattenedTreeRow } from "../utils/tree";
import { RADIO_GROUP_KEY } from "../composables/useRadioGroup";
import { defaultCompare, useTableSort } from "../composables/useTableSort";
import { useTableFilters } from "../composables/useTableFilters";
import SortHeaderButton from "./SortHeaderButton.vue";
import TableFilterToolbar from "./TableFilterToolbar.vue";
import Checkbox from "./Checkbox.vue";
import Radio from "./Radio.vue";

/**
 * `TreeTableColumn` is intentionally its own type rather than a reuse of
 * `DataTableColumn` — see design-docs/treetable.md §1. They're structurally
 * similar today because the "what is a column" concept is genuinely shared,
 * but the two components stay independent so a future DataTable change
 * doesn't silently ripple into TreeTable.
 */
export interface TreeTableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  header: string;
  sortable?: boolean;
  accessor?: (row: T) => unknown;
  /** Overrides the default comparator when sorting this column — applied within each sibling group, never across the whole flattened tree. */
  sortFn?: (a: T, b: T) => number;
  /** @default "start" */
  align?: "start" | "center" | "end";
  filterable?: boolean;
  /** @default "text" unless `filterOptions` is given, in which case "select" */
  filterType?: TreeTableFilterType;
  filterOptions?: string[];
}

export interface TreeTableSortState {
  key: string;
  direction: "asc" | "desc";
}

export type TreeTableSelectionMode = "single" | "multiple" | "none";

export type TreeTableFilterType = "text" | "select";

export interface TreeTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: TreeTableColumn<T>[];
  rows: T[];
  rowKey: keyof T | ((row: T) => string | number);
  /** Property on each row holding its nested rows. @default "children" */
  childrenKey?: keyof T;
  /** v-model:expanded — row keys of currently expanded nodes. */
  expanded?: Array<string | number>;
  /** v-model:sort. Null when no column is sorted. Sorts within each sibling group; never reorders across levels. */
  sort?: TreeTableSortState | null;
  loading?: boolean;
  /** Visually-hidden by default; gives the table an accessible name. */
  caption?: string;
  /** @default "none" */
  selectionMode?: TreeTableSelectionMode;
  /** v-model:selected — selected row *keys*, scoped to currently visible (expanded-into) rows, same convention as DataTable. */
  selected?: Array<string | number>;
  /** v-model:globalFilter — free-text query matched against every `filterable` column. */
  globalFilter?: string;
  /** v-model:columnFilters — per-column filter values, keyed by column `key`. */
  columnFilters?: Record<string, string>;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<TreeTableProps<T>>(), {
  sort: null,
  loading: false,
  selectionMode: "none",
  selected: () => [],
  globalFilter: "",
  columnFilters: () => ({}),
  expanded: () => [],
});

const emit = defineEmits<{
  "update:expanded": [value: Array<string | number>];
  "update:sort": [value: TreeTableSortState | null];
  "update:selected": [value: Array<string | number>];
  "update:globalFilter": [value: string];
  "update:columnFilters": [value: Record<string, string>];
}>();

defineSlots<{
  empty?(): unknown;
  loading?(): unknown;
  "no-results"?(): unknown;
  [slotName: `cell-${string}`]: (scope: {
    row: T;
    value: unknown;
    rowIndex: number;
    depth: number;
    hasChildren: boolean;
    isExpanded: boolean;
  }) => unknown;
}>();

const childrenKey = computed(() => props.childrenKey ?? ("children" as keyof T));

function cellValue(column: TreeTableColumn<T>, row: T): unknown {
  return column.accessor ? column.accessor(row) : row[column.key as keyof T];
}

function getRowKey(row: T, index: number): string | number {
  if (typeof props.rowKey === "function") return props.rowKey(row);
  const value = row[props.rowKey];
  if (typeof value === "string" || typeof value === "number") return value;
  if (import.meta.env.DEV) {
    console.warn(
      `[stance/TreeTable] rowKey "${String(props.rowKey)}" is missing or non-primitive on a row — falling back to its index within its sibling group, which is not stable across sorting/filtering and can collide with another sibling group's index. Pass a rowKey that resolves to a unique string/number per row.`,
    );
  }
  return index;
}

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

function rowMatchesFilters(row: T): boolean {
  const query = props.globalFilter.trim().toLowerCase();
  if (query && !filterableColumns.value.some((column) => String(cellValue(column, row) ?? "").toLowerCase().includes(query))) {
    return false;
  }

  const activeColumnFilters = Object.entries(props.columnFilters).filter(([, value]) => value !== "");
  return activeColumnFilters.every(([key, value]) => {
    const column = props.columns.find((c) => c.key === key);
    if (!column) return true;
    const cell = cellValue(column, row);
    if (filterTypeFor(column) === "select") return String(cell ?? "") === value;
    return String(cell ?? "").toLowerCase().includes(value.toLowerCase());
  });
}

// Ancestor-preserving: a matching descendant keeps its whole ancestor chain
// visible, so the result reads as a tree, not a disconnected leaf list.
const filteredTree = computed(() => {
  if (!hasActiveFilters.value) return props.rows;
  return filterTree(props.rows, rowMatchesFilters, childrenKey.value);
});

const noResultsFromFilter = computed(() => props.rows.length > 0 && hasActiveFilters.value && filteredTree.value.length === 0);

watch(
  () => [props.globalFilter, props.columnFilters, filteredTree.value.length] as const,
  () => announceResultCount(filteredTree.value.length),
);

const { toggleSort, ariaSortFor } = useTableSort<TreeTableColumn<T>>(
  () => props.sort,
  (next) => emit("update:sort", next),
);

// Sorts within each sibling group independently — hierarchy is never
// flattened or reordered across levels (see design-docs/treetable.md §1).
const sortedTree = computed(() => {
  if (!props.sort) return filteredTree.value;
  const sort = props.sort;
  const column = props.columns.find((c) => c.key === sort.key);
  if (!column) return filteredTree.value;
  const compare = column.sortFn ?? defaultCompare<T>((row) => cellValue(column, row));
  const factor = sort.direction === "asc" ? 1 : -1;
  return sortTree(filteredTree.value, (a, b) => compare(a, b) * factor, childrenKey.value);
});

const expandedSet = computed(() => new Set(props.expanded));

function setExpanded(key: string | number, value: boolean) {
  const next = new Set(expandedSet.value);
  if (value) next.add(key);
  else next.delete(key);
  emit("update:expanded", Array.from(next));
}

// Toggles from the row's currently *displayed* expanded state, not the raw
// `expanded` prop — while a filter is active those two can disagree (a row
// can be shown expanded by the filter override below without actually being
// in the user's real `expanded` state), and toggling against the wrong one
// would silently corrupt real expand state once the filter is cleared.
function toggleExpand(rowMeta: FlattenedTreeRow<T>) {
  setExpanded(rowMeta.key, !rowMeta.isExpanded);
}

// While a filter is active, the pruned tree already contains only matches
// and their ancestors — so everything in it is shown expanded, regardless
// of collapse state, rather than leaving a matching descendant hidden
// behind a still-collapsed ancestor.
const effectiveExpandedSet = computed(() => {
  if (!hasActiveFilters.value) return expandedSet.value;
  return new Set(collectExpandableKeys(sortedTree.value, getRowKey, childrenKey.value));
});

const visibleRows = computed(() =>
  flattenVisibleTree(sortedTree.value, effectiveExpandedSet.value, getRowKey, childrenKey.value),
);

const visibleRowIndexByKey = computed(() => {
  const map = new Map<string | number, number>();
  visibleRows.value.forEach((row, index) => map.set(row.key, index));
  return map;
});

const selectedSet = computed(() => new Set(props.selected));

function isRowSelected(key: string | number): boolean {
  return selectedSet.value.has(key);
}

function setRowSelected(key: string | number, checked: boolean) {
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

// "Select all" scope is the currently visible (expanded-into) rows, not
// every row in the tree — same convention as DataTable's paged-rows scoping.
const visibleRowKeys = computed(() => visibleRows.value.map((r) => r.key));

const allRowsSelected = computed(
  () => visibleRowKeys.value.length > 0 && visibleRowKeys.value.every((k) => selectedSet.value.has(k)),
);
const someRowsSelected = computed(() => !allRowsSelected.value && visibleRowKeys.value.some((k) => selectedSet.value.has(k)));

function setAllRowsSelected(checked: boolean) {
  if (checked) {
    emit("update:selected", Array.from(new Set([...props.selected, ...visibleRowKeys.value])));
  } else {
    const removed = new Set(visibleRowKeys.value);
    emit(
      "update:selected",
      props.selected.filter((k) => !removed.has(k)),
    );
  }
}

const radioGroupName = useId();
provide(RADIO_GROUP_KEY, {
  name: computed(() => radioGroupName),
  modelValue: computed(() => (props.selected.length > 0 ? String(props.selected[0]) : undefined)),
  disabled: computed(() => false),
  required: computed(() => false),
  invalid: computed(() => false),
  describedBy: computed(() => undefined),
  updateValue: (value: string) => {
    const row = visibleRows.value.find((r) => String(r.key) === value);
    if (row) emit("update:selected", [row.key]);
  },
});

// --- Roving-tabindex grid keyboard navigation -------------------------------
// Only the data columns participate (the select checkbox/radio column, when
// present, is reached via ordinary Tab order instead — see
// design-docs/treetable.md's scoping note).
const activeKey = ref<string | number | undefined>(undefined);
const activeColIndex = ref(0);
const activeCellEl = ref<HTMLElement | null>(null);

watch(
  visibleRows,
  (rows) => {
    if (rows.length === 0) {
      activeKey.value = undefined;
      return;
    }
    if (activeKey.value === undefined || !rows.some((r) => r.key === activeKey.value)) {
      activeKey.value = rows[0]!.key;
    }
  },
  { immediate: true },
);

function setCellRef(rowKey: string | number, colIndex: number, el: Element | null) {
  if (rowKey === activeKey.value && colIndex === activeColIndex.value) {
    activeCellEl.value = el as HTMLElement | null;
  }
}

function focusActiveCell() {
  nextTick(() => activeCellEl.value?.focus());
}

function moveRow(delta: number) {
  const index = activeKey.value === undefined ? undefined : visibleRowIndexByKey.value.get(activeKey.value);
  if (index === undefined) return;
  const nextIndex = Math.min(Math.max(index + delta, 0), visibleRows.value.length - 1);
  activeKey.value = visibleRows.value[nextIndex]!.key;
  focusActiveCell();
}

function moveCol(delta: number) {
  activeColIndex.value = Math.min(Math.max(activeColIndex.value + delta, 0), props.columns.length - 1);
  focusActiveCell();
}

function setActiveRow(key: string | number) {
  activeKey.value = key;
  focusActiveCell();
}

function onCellKeydown(event: KeyboardEvent, rowMeta: FlattenedTreeRow<T>, colIndex: number) {
  const isPrimary = colIndex === 0;
  switch (event.key) {
    case "ArrowRight":
      event.preventDefault();
      if (isPrimary && rowMeta.hasChildren && !rowMeta.isExpanded) {
        setExpanded(rowMeta.key, true);
        focusActiveCell();
      } else if (isPrimary && rowMeta.hasChildren && rowMeta.isExpanded) {
        moveRow(1);
      } else {
        moveCol(1);
      }
      break;
    case "ArrowLeft":
      event.preventDefault();
      if (isPrimary && rowMeta.hasChildren && rowMeta.isExpanded) {
        setExpanded(rowMeta.key, false);
        focusActiveCell();
      } else if (isPrimary && rowMeta.parentKey !== undefined) {
        setActiveRow(rowMeta.parentKey);
      } else {
        moveCol(-1);
      }
      break;
    case "ArrowDown":
      event.preventDefault();
      moveRow(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      moveRow(-1);
      break;
    case "Home":
      event.preventDefault();
      moveCol(-Infinity);
      break;
    case "End":
      event.preventDefault();
      moveCol(Infinity);
      break;
    case "Enter":
    case " ":
      if (isPrimary && rowMeta.hasChildren) {
        event.preventDefault();
        toggleExpand(rowMeta);
      }
      break;
  }
}

const rootClass = computed(() => cn("stance-treetable", props.class));
const colCount = computed(() => props.columns.length + (props.selectionMode !== "none" ? 1 : 0));
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

    <div class="stance-treetable__scroll">
      <table class="stance-treetable__table" role="treegrid">
        <caption v-if="caption" class="stance-visually-hidden">{{ caption }}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th v-if="selectionMode !== 'none'" scope="col" role="columnheader" class="stance-treetable__select-cell">
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
            <td :colspan="colCount" role="gridcell" class="stance-treetable__status-cell">
              <slot name="loading">Loading…</slot>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0" role="row">
            <td :colspan="colCount" role="gridcell" class="stance-treetable__status-cell">
              <slot name="empty">No data.</slot>
            </td>
          </tr>
          <tr v-else-if="noResultsFromFilter" role="row">
            <td :colspan="colCount" role="gridcell" class="stance-treetable__status-cell">
              <slot name="no-results">No rows match your filters.</slot>
            </td>
          </tr>
          <tr
            v-for="(rowMeta, rowIndex) in loading || rows.length === 0 || noResultsFromFilter ? [] : visibleRows"
            :key="rowMeta.key"
            role="row"
            :aria-level="rowMeta.depth + 1"
            :aria-expanded="rowMeta.hasChildren ? rowMeta.isExpanded : undefined"
            :aria-setsize="rowMeta.setSize"
            :aria-posinset="rowMeta.posInSet"
            :aria-selected="selectionMode !== 'none' ? isRowSelected(rowMeta.key) : undefined"
            :data-depth="rowMeta.depth"
            :style="{ '--stance-treetable-depth': rowMeta.depth }"
          >
            <td v-if="selectionMode !== 'none'" role="gridcell" data-label="Select" class="stance-treetable__select-cell">
              <Checkbox
                v-if="selectionMode === 'multiple'"
                :model-value="isRowSelected(rowMeta.key)"
                @update:model-value="(checked) => setRowSelected(rowMeta.key, checked)"
              >
                <span class="stance-visually-hidden">Select row</span>
              </Checkbox>
              <Radio v-else :value="String(rowMeta.key)">
                <span class="stance-visually-hidden">Select row</span>
              </Radio>
            </td>
            <td
              v-for="(column, colIndex) in columns"
              :key="column.key"
              :ref="(el) => setCellRef(rowMeta.key, colIndex, el as Element | null)"
              role="gridcell"
              :tabindex="rowMeta.key === activeKey && colIndex === activeColIndex ? 0 : -1"
              :aria-expanded="colIndex === 0 && rowMeta.hasChildren ? rowMeta.isExpanded : undefined"
              :data-label="column.header"
              :data-align="column.align ?? 'start'"
              @keydown="onCellKeydown($event, rowMeta, colIndex)"
              @focus="activeKey = rowMeta.key; activeColIndex = colIndex"
            >
              <span v-if="colIndex === 0" class="stance-treetable__primary-cell">
                <button
                  v-if="rowMeta.hasChildren"
                  type="button"
                  class="stance-treetable__disclosure"
                  tabindex="-1"
                  :aria-expanded="rowMeta.isExpanded"
                  :aria-label="rowMeta.isExpanded ? 'Collapse row' : 'Expand row'"
                  @click.stop="toggleExpand(rowMeta)"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" :data-expanded="rowMeta.isExpanded">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <span v-else class="stance-treetable__disclosure-spacer" aria-hidden="true" />
                <slot
                  :name="`cell-${column.key}`"
                  :row="rowMeta.row"
                  :value="cellValue(column, rowMeta.row)"
                  :row-index="rowIndex"
                  :depth="rowMeta.depth"
                  :has-children="rowMeta.hasChildren"
                  :is-expanded="rowMeta.isExpanded"
                >
                  {{ cellValue(column, rowMeta.row) }}
                </slot>
              </span>
              <slot
                v-else
                :name="`cell-${column.key}`"
                :row="rowMeta.row"
                :value="cellValue(column, rowMeta.row)"
                :row-index="rowIndex"
                :depth="rowMeta.depth"
                :has-children="rowMeta.hasChildren"
                :is-expanded="rowMeta.isExpanded"
              >
                {{ cellValue(column, rowMeta.row) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
:where(.stance-treetable) {
  container-type: inline-size;
  container-name: stance-treetable;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-treetable__scroll) {
  overflow-x: auto;
}

:where(.stance-treetable__table) {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--stance-text-sm, 0.875rem);
}

:where(.stance-treetable__select-cell) {
  width: 1%;
  white-space: nowrap;
  text-align: center;
}

:where(.stance-treetable__table th) {
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  border-bottom: 1px solid var(--stance-color-border);
  font-weight: var(--stance-font-weight-semibold, 600);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-treetable__table td) {
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  border-bottom: 1px solid var(--stance-color-border);
}

:where(.stance-treetable__table tbody tr:last-child td) {
  border-bottom: none;
}

:where(.stance-treetable__table td:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: -2px;
}

:where(.stance-treetable__table [data-align="start"]) {
  text-align: start;
}
:where(.stance-treetable__table [data-align="center"]) {
  text-align: center;
}
:where(.stance-treetable__table [data-align="end"]) {
  text-align: end;
}

:where(.stance-treetable__primary-cell) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  /* --stance-treetable-depth is set on the row (<tr>) and inherits down —
     reading it here (rather than an inline style on this span) keeps the
     actual padding declaration in the stylesheet, so the narrow-container
     override below can win it via ordinary cascade order alone. */
  padding-inline-start: calc(var(--stance-treetable-depth, 0) * 1.25rem);
}

:where(.stance-treetable__disclosure) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: none;
  color: var(--stance-color-muted-foreground);
  cursor: pointer;
}

:where(.stance-treetable__disclosure svg) {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform var(--stance-motion-duration, 0.15s) ease;
}

:where(.stance-treetable__disclosure svg[data-expanded="true"]) {
  transform: rotate(90deg);
}

:where(.stance-treetable__disclosure:hover) {
  background: var(--stance-color-muted);
}

:where(.stance-treetable__disclosure-spacer) {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;
}

:where(.stance-treetable__status-cell) {
  padding: var(--stance-spacing-lg, 1rem);
  text-align: center;
  color: var(--stance-color-muted-foreground);
}

/* Below this container width, collapse to a stacked card per visible row —
   same technique as DataTable (real <thead> stays in the DOM, screen-reader
   only). Depth/hierarchy loses its natural home (cell indentation) once a
   row is a card, so it's represented instead as a graduated left border
   scaled by depth, applied to the whole card. */
@container stance-treetable (max-width: 32rem) {
  :where(.stance-treetable__table),
  :where(.stance-treetable__table tbody),
  :where(.stance-treetable__table tr) {
    display: block;
    width: 100%;
  }

  :where(.stance-treetable__table thead) {
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

  /* Depth/hierarchy loses its natural home (cell indentation) once a row
     becomes a card, so it's represented here instead: a left padding
     graduated by --stance-treetable-depth (same custom property the wide
     layout reads for cell indentation), plus a left-border accent flagging
     "this card is nested" at a glance. */
  :where(.stance-treetable__table tbody tr) {
    margin-bottom: var(--stance-spacing-md, 0.75rem);
    border: 1px solid var(--stance-color-border);
    border-inline-start-width: 3px;
    border-radius: var(--stance-radius-md, 0.5rem);
    padding-block: var(--stance-spacing-sm, 0.5rem);
    padding-inline: calc(var(--stance-spacing-md, 0.75rem) + var(--stance-treetable-depth, 0) * 1rem)
      var(--stance-spacing-md, 0.75rem);
  }

  :where(.stance-treetable__table tbody tr[data-depth="0"]) {
    border-inline-start-color: var(--stance-color-border);
  }
  :where(.stance-treetable__table tbody tr:not([data-depth="0"])) {
    border-inline-start-color: var(--stance-color-primary);
  }

  :where(.stance-treetable__table tbody tr:last-child) {
    margin-bottom: 0;
  }

  :where(.stance-treetable__table td) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--stance-spacing-md, 0.75rem);
    padding: var(--stance-spacing-xs, 0.25rem) 0;
    border-bottom: none;
    text-align: end;
  }

  :where(.stance-treetable__table td)::before {
    content: attr(data-label);
    font-weight: var(--stance-font-weight-medium, 500);
    color: var(--stance-color-muted-foreground);
    text-align: start;
  }

  /* Indentation now lives on the card (tr) itself, above — the primary
     cell's own indentation would double it up, so it's zeroed here. Both
     rules are :where()-wrapped (specificity 0); this one simply comes
     later in source order, so it wins the cascade tie plainly. */
  :where(.stance-treetable__primary-cell) {
    padding-inline-start: 0;
  }

  :where(.stance-treetable__status-cell) {
    text-align: center;
  }

  :where(.stance-treetable__status-cell)::before {
    content: none;
  }
}
</style>
