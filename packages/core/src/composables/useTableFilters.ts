import { computed, onUnmounted, useId } from "vue";
import { useLiveAnnouncer } from "./useLiveAnnouncer";

export type TableFilterType = "text" | "select";

export interface TableFilterColumn {
  key: string;
  filterable?: boolean;
  filterType?: TableFilterType;
  filterOptions?: string[];
}

export interface UseTableFiltersOptions<C extends TableFilterColumn> {
  columns: () => C[];
  globalFilter: () => string;
  columnFilters: () => Record<string, string>;
  emitColumnFilters: (next: Record<string, string>) => void;
}

/**
 * Shared filter-toolbar state for DataTable and TreeTable: which columns are
 * filterable, per-column filter get/set, id generation for the toolbar's
 * form controls, and the debounced-announce bookkeeping for "N results
 * match your filters" (call the returned `announceResultCount` from a
 * `watch` on whatever actually changes the result count — that differs
 * between flat filtering and ancestor-preserving tree filtering, so it
 * stays in each component). What's shared here is the timer/cleanup
 * mechanics, not the "when" — each component decides that for itself.
 */
export function useTableFilters<C extends TableFilterColumn>(options: UseTableFiltersOptions<C>) {
  const { announce } = useLiveAnnouncer();

  const filterableColumns = computed(() => options.columns().filter((c) => c.filterable));

  function filterTypeFor(column: C): TableFilterType {
    return column.filterType ?? (column.filterOptions ? "select" : "text");
  }

  const hasActiveFilters = computed(() => {
    if (options.globalFilter().trim() !== "") return true;
    return Object.values(options.columnFilters()).some((value) => value !== "");
  });

  function columnFilterValue(column: C): string {
    return options.columnFilters()[column.key] ?? "";
  }

  function setColumnFilter(column: C, value: string) {
    const next = { ...options.columnFilters() };
    if (value === "") {
      delete next[column.key];
    } else {
      next[column.key] = value;
    }
    options.emitColumnFilters(next);
  }

  const filterIdBase = useId();
  const globalFilterId = computed(() => `${filterIdBase}-global-filter`);
  function columnFilterId(column: C): string {
    return `${filterIdBase}-filter-${column.key}`;
  }

  let filterAnnounceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Debounced "N results match your filters" — a no-op unless a filter is
   * actually active. Call from a `watch` on whatever combination of
   * globalFilter/columnFilters/result-count means "the visible results may
   * have changed" for that component.
   */
  function announceResultCount(count: number) {
    if (!hasActiveFilters.value) return;
    if (filterAnnounceTimer) clearTimeout(filterAnnounceTimer);
    filterAnnounceTimer = setTimeout(() => {
      announce(`${count} ${count === 1 ? "result matches" : "results match"} your filters`);
    }, 400);
  }

  onUnmounted(() => {
    if (filterAnnounceTimer) clearTimeout(filterAnnounceTimer);
  });

  return {
    filterableColumns,
    filterTypeFor,
    hasActiveFilters,
    columnFilterValue,
    setColumnFilter,
    globalFilterId,
    columnFilterId,
    announceResultCount,
  };
}
