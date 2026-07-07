export interface TableSortColumn {
  key: string;
  sortable?: boolean;
}

export interface TableSortState {
  key: string;
  direction: "asc" | "desc";
}

/** Generic ascending/localeCompare fallback comparator, shared by DataTable and TreeTable. */
export function defaultCompare<T extends Record<string, unknown>>(
  cellValue: (row: T) => unknown,
): (a: T, b: T) => number {
  return (a, b) => {
    const av = cellValue(a);
    const bv = cellValue(b);
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    if (av instanceof Date && bv instanceof Date) return av.getTime() - bv.getTime();
    return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
  };
}

/**
 * Shared click-to-cycle sort state + `aria-sort` derivation, used by both
 * DataTable and TreeTable's column headers. What differs between them (flat
 * vs. per-sibling-group sorting of the actual rows) stays in each
 * component — this only owns the state transition and the header UI's ARIA.
 */
export function useTableSort<C extends TableSortColumn>(
  sort: () => TableSortState | null,
  emitSort: (next: TableSortState | null) => void,
) {
  function toggleSort(column: C) {
    if (!column.sortable) return;
    const current = sort();
    let next: TableSortState | null;
    if (!current || current.key !== column.key) {
      next = { key: column.key, direction: "asc" };
    } else if (current.direction === "asc") {
      next = { key: column.key, direction: "desc" };
    } else {
      next = null;
    }
    emitSort(next);
  }

  function ariaSortFor(column: C): "ascending" | "descending" | "none" | undefined {
    if (!column.sortable) return undefined;
    const current = sort();
    if (current?.key !== column.key) return "none";
    return current.direction === "asc" ? "ascending" : "descending";
  }

  return { toggleSort, ariaSortFor };
}
