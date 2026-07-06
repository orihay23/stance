/**
 * Pure tree-shaping helpers for TreeTable — kept independent of Vue so the
 * filter/sort/flatten algorithms are testable without mounting a component.
 * See design-docs/treetable.md for why these can't just reuse DataTable's
 * flat-array filteredRows/sortedRows/pagedRows.
 */

export function getChildren<T>(row: T, childrenKey: keyof T): T[] {
  const children = row[childrenKey];
  return Array.isArray(children) ? (children as T[]) : [];
}

/**
 * Keeps a node if it matches `predicate` itself, or if any descendant does —
 * so a matching leaf's ancestor chain stays visible for context instead of
 * the result reading as a broken, disconnected list.
 */
export function filterTree<T>(rows: T[], predicate: (row: T) => boolean, childrenKey: keyof T): T[] {
  const result: T[] = [];
  for (const row of rows) {
    const children = getChildren(row, childrenKey);
    const filteredChildren = children.length > 0 ? filterTree(children, predicate, childrenKey) : [];
    if (predicate(row) || filteredChildren.length > 0) {
      result.push(filteredChildren.length > 0 ? { ...row, [childrenKey]: filteredChildren } : row);
    }
  }
  return result;
}

/** Sorts each sibling group independently, preserving hierarchy — never flattens across levels. */
export function sortTree<T>(rows: T[], compare: (a: T, b: T) => number, childrenKey: keyof T): T[] {
  return [...rows]
    .sort(compare)
    .map((row) => {
      const children = getChildren(row, childrenKey);
      return children.length > 0 ? { ...row, [childrenKey]: sortTree(children, compare, childrenKey) } : row;
    });
}

/**
 * Every key in the tree that has children — used to build an "expand
 * everything" set while a filter is active, since the filtered (pruned)
 * tree by construction contains only matches and their ancestors, so
 * there's no reason to hide any of it behind stale collapse state.
 */
export function collectExpandableKeys<T>(
  rows: T[],
  getRowKey: (row: T, index: number) => string | number,
  childrenKey: keyof T,
): Array<string | number> {
  const keys: Array<string | number> = [];
  rows.forEach((row, index) => {
    const children = getChildren(row, childrenKey);
    if (children.length > 0) {
      keys.push(getRowKey(row, index));
      keys.push(...collectExpandableKeys(children, getRowKey, childrenKey));
    }
  });
  return keys;
}

export interface FlattenedTreeRow<T> {
  row: T;
  key: string | number;
  /** 0-indexed; render as `aria-level={depth + 1}`. */
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  /** 1-indexed position among this row's own siblings — for `aria-posinset`. */
  posInSet: number;
  /** Sibling count under the same parent — for `aria-setsize`. */
  setSize: number;
  parentKey: string | number | undefined;
}

/**
 * Walks the tree respecting `expandedKeys`, producing the flat list of rows
 * that should actually render right now (a collapsed node's descendants are
 * simply absent, not hidden-but-present).
 */
export function flattenVisibleTree<T>(
  rows: T[],
  expandedKeys: ReadonlySet<string | number>,
  getRowKey: (row: T, index: number) => string | number,
  childrenKey: keyof T,
  depth = 0,
  parentKey: string | number | undefined = undefined,
): FlattenedTreeRow<T>[] {
  const result: FlattenedTreeRow<T>[] = [];
  const setSize = rows.length;
  rows.forEach((row, index) => {
    const key = getRowKey(row, index);
    const children = getChildren(row, childrenKey);
    const hasChildren = children.length > 0;
    const isExpanded = expandedKeys.has(key);
    result.push({ row, key, depth, hasChildren, isExpanded, posInSet: index + 1, setSize, parentKey });
    if (hasChildren && isExpanded) {
      result.push(...flattenVisibleTree(children, expandedKeys, getRowKey, childrenKey, depth + 1, key));
    }
  });
  return result;
}
