import { describe, expect, it } from "vitest";
import { collectExpandableKeys, filterTree, flattenVisibleTree, sortTree } from "./tree";

interface Node {
  id: string;
  name: string;
  size: number;
  children?: Node[];
}

const tree: Node[] = [
  {
    id: "a",
    name: "Charlie",
    size: 30,
    children: [
      { id: "a1", name: "Beta", size: 5 },
      { id: "a2", name: "Alpha", size: 1 },
    ],
  },
  {
    id: "b",
    name: "Alpha",
    size: 20,
    children: [{ id: "b1", name: "Zulu", size: 2 }],
  },
  { id: "c", name: "Delta", size: 10 },
];

function getRowKey(row: Node): string {
  return row.id;
}

describe("filterTree", () => {
  it("keeps a matching leaf's ancestor chain visible", () => {
    const result = filterTree(tree, (row) => row.name === "Zulu", "children");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("b");
    expect(result[0]!.children).toHaveLength(1);
    expect(result[0]!.children![0]!.id).toBe("b1");
  });

  it("drops branches with no matching descendant and no self-match", () => {
    const result = filterTree(tree, (row) => row.name === "Zulu", "children");
    expect(result.some((r) => r.id === "a")).toBe(false);
    expect(result.some((r) => r.id === "c")).toBe(false);
  });

  it("keeps a matching parent even if its children don't match", () => {
    const result = filterTree(tree, (row) => row.id === "a", "children");
    expect(result).toHaveLength(1);
    expect(result[0]!.children).toHaveLength(2);
  });

  it("does not mutate the original tree", () => {
    filterTree(tree, (row) => row.name === "Zulu", "children");
    expect(tree[0]!.children).toHaveLength(2);
  });
});

describe("sortTree", () => {
  const byName = (a: Node, b: Node) => a.name.localeCompare(b.name);

  it("sorts top-level siblings", () => {
    const result = sortTree(tree, byName, "children");
    expect(result.map((r) => r.name)).toEqual(["Alpha", "Charlie", "Delta"]);
  });

  it("sorts each nested sibling group independently, preserving hierarchy", () => {
    const result = sortTree(tree, byName, "children");
    const charlie = result.find((r) => r.name === "Charlie")!;
    expect(charlie.children!.map((c) => c.name)).toEqual(["Alpha", "Beta"]);
  });

  it("never reorders a child above a different parent (hierarchy preserved)", () => {
    const result = sortTree(tree, byName, "children");
    // "Alpha" appears both as a top-level row (b) and nested under Charlie
    // (a2) — sorting must not merge/reorder them into one flat list.
    expect(result).toHaveLength(3);
  });

  it("leaves leaf rows (no children) untouched", () => {
    const result = sortTree(tree, byName, "children");
    const delta = result.find((r) => r.name === "Delta")!;
    expect(delta.children).toBeUndefined();
  });
});

describe("flattenVisibleTree", () => {
  it("only includes top-level rows when nothing is expanded", () => {
    const result = flattenVisibleTree(tree, new Set(), getRowKey, "children");
    expect(result.map((r) => r.key)).toEqual(["a", "b", "c"]);
    expect(result.every((r) => r.depth === 0)).toBe(true);
  });

  it("includes a node's children only when its key is in expandedKeys", () => {
    const result = flattenVisibleTree(tree, new Set(["a"]), getRowKey, "children");
    expect(result.map((r) => r.key)).toEqual(["a", "a1", "a2", "b", "c"]);
    expect(result.find((r) => r.key === "a1")!.depth).toBe(1);
  });

  it("supports multiple simultaneously expanded branches", () => {
    const result = flattenVisibleTree(tree, new Set(["a", "b"]), getRowKey, "children");
    expect(result.map((r) => r.key)).toEqual(["a", "a1", "a2", "b", "b1", "c"]);
  });

  it("computes hasChildren correctly", () => {
    const result = flattenVisibleTree(tree, new Set(), getRowKey, "children");
    expect(result.find((r) => r.key === "a")!.hasChildren).toBe(true);
    expect(result.find((r) => r.key === "c")!.hasChildren).toBe(false);
  });

  it("computes posInSet/setSize per sibling group, not globally", () => {
    const result = flattenVisibleTree(tree, new Set(["a"]), getRowKey, "children");
    const a1 = result.find((r) => r.key === "a1")!;
    const a2 = result.find((r) => r.key === "a2")!;
    expect(a1.posInSet).toBe(1);
    expect(a2.posInSet).toBe(2);
    expect(a1.setSize).toBe(2);

    const c = result.find((r) => r.key === "c")!;
    expect(c.posInSet).toBe(3);
    expect(c.setSize).toBe(3);
  });

  it("records parentKey, undefined at the root", () => {
    const result = flattenVisibleTree(tree, new Set(["a"]), getRowKey, "children");
    expect(result.find((r) => r.key === "a1")!.parentKey).toBe("a");
    expect(result.find((r) => r.key === "a")!.parentKey).toBeUndefined();
  });

  it("a collapsed node's descendants are entirely absent, not just hidden", () => {
    const result = flattenVisibleTree(tree, new Set(), getRowKey, "children");
    expect(result.some((r) => r.key === "a1")).toBe(false);
  });
});

describe("collectExpandableKeys", () => {
  it("returns every key that has children, at every depth", () => {
    const keys = collectExpandableKeys(tree, getRowKey, "children");
    expect(new Set(keys)).toEqual(new Set(["a", "b"]));
  });

  it("excludes leaf keys", () => {
    const keys = collectExpandableKeys(tree, getRowKey, "children");
    expect(keys).not.toContain("a1");
    expect(keys).not.toContain("c");
  });
});
