# TreeTable design doc

Status: approved, not yet implemented. Written ahead of implementation per
CLAUDE.md's Phase 6 plan, given the ARIA immaturity around tree tables.

## 1. Standalone component vs. DataTable extension

**Decision: standalone `TreeTable.vue`, not a `mode="tree"` on DataTable.**

DataTable's sort/filter/pagination aren't generic "table machinery" behind a
clean interface — they're flat-array algorithms baked directly into the
component (`sortedRows` calls `Array.prototype.sort` once, `filteredRows`
calls `.filter()` once, `pagedRows` slices by index range). None of that
generalizes to a tree without a rewrite:

- **Sort** on a tree has to happen *per sibling group*, preserving
  hierarchy — not a single flat `.sort()`.
- **Filter** on a tree conventionally keeps a matching row's *ancestor
  chain* visible even when the ancestors themselves don't match, or the
  result reads as broken — a different algorithm, not predicate reuse.
- **Pagination** over a tree is genuinely ambiguous (does "page 2" mean the
  2nd page of currently-*visible* rows, re-paginating every time something
  expands/collapses?) — most real implementations just don't paginate
  trees. Deliberately out of scope for v1 (see below).
- Expand/collapse is state DataTable has no concept of at all.
- **Keyboard model differs, not just data shape.** `role="table"` (DataTable
  today) is a *static* ARIA role — no required keyboard behavior beyond
  native Tab-through-controls. `role="treegrid"` is a *widget* role
  requiring full roving-tabindex arrow-key grid navigation. DataTable has
  none of that machinery today; TreeTable needs it from scratch either way.

A `mode="tree"` flag would mean forking nearly every computed anyway, inside
an already-830-line file, while adding a matrix of prop combinations that
don't make sense together (`paginationMode="client"` + tree? `manualSort`
when sort must preserve hierarchy?) — real risk to an already-shipped,
fully-tested component for not much actual sharing.

**Cost accepted**: some UI boilerplate (sort-icon button, filter toolbar
markup, container-query collapse CSS, checkbox-selection wiring) will exist
in two places. TreeTable gets its own `TreeTableColumn` type — structurally
similar to `DataTableColumn` today, but conceptually independent, so a
future DataTable change doesn't silently ripple into TreeTable. Revisit
extracting shared internals once TreeTable's real shape is settled, if the
duplication actually hurts — not worth doing preemptively (YAGNI).

## 2. Accessibility pattern: `role="treegrid"`, synthesized from `tree` + `grid`

`treegrid` is a real, spec-defined ARIA role — what's missing is a worked
APG example the way there's one for `tree` or `grid` individually, so this
is genuinely synthesized, not copied from a pattern page.

- Keep DataTable's real `<table>` markup approach (native scrolling/
  find-in-page benefits survive). Root gets `role="treegrid"`.
- Each row: `role="row"`, plus `aria-level` (1-indexed depth), `aria-expanded`
  (present only on rows that *have* children — omitted entirely on leaves),
  and `aria-setsize`/`aria-posinset` computed explicitly per sibling group.
  Necessary because collapsed subtrees mean the DOM can't implicitly convey
  "3 of 7" the way it can for a flat table.
- **Keyboard — the ambiguous part, resolved rather than guessed through**:
  ARIA's own guidance splits behavior by column.
  - On the *primary* (first/label) column: ArrowRight expands (or moves to
    the first child if already expanded); ArrowLeft collapses (or moves to
    the parent if already collapsed/a leaf) — Tree View semantics.
  - On every *other* column: ArrowLeft/ArrowRight move focus horizontally
    between cells — Grid semantics.
  - ArrowUp/ArrowDown always move vertically between currently-*visible*
    rows (skipping collapsed rows' hidden descendants), regardless of
    column.
  - Both halves are implemented — collapsing this to "arrows always
    expand/collapse" or "arrows always move" would each break a real use
    case.
- A disclosure `<button aria-label="Collapse row" aria-expanded>` in the
  primary cell is the discoverable, unambiguous toggle (click/Enter/Space).
  The arrow-key behavior above is the power-user path, not the only path.

## 3. Scope

**v1 (this pass):**
- Static, fully in-memory nested data — `rows: (T & { children?: T[] })[]`,
  no async loading
- Expand/collapse via `v-model:expanded` (row keys) — same v-model
  convention as DataTable's `selected`
- Full `treegrid` semantics + the keyboard model above
- `TreeTableColumn` (own type, DataTable-column-shaped), cell slots,
  checkbox/radio selection scoped to visible rows
- Sort: client-side only, per-sibling-group (hierarchy preserved) — no
  `manualSort`/server mode yet
- Filter: included in v1, using the ancestor-path-preserving convention (a
  matching descendant keeps its ancestor chain visible) — standard enough
  across real tree-table implementations that it doesn't need its own
  sign-off round
- No pagination in v1 — deliberate omission, not an oversight, given how
  ambiguous "a page of a tree" is

**Deferred to its own follow-up phase** (meaningfully bigger, different kind
of risk):
- Async/lazy child loading (per-row loading/error state machine)
- Drag-to-reorder/reparent — a different interaction model entirely, and
  drag-and-drop a11y is an unsolved-ish problem even for flat lists
- Column resize/reorder, virtualization for very large trees

## 4. Responsive / narrow-container behavior

Reuse DataTable's exact stacked-card technique (keep `<thead>` in the DOM
but visually hidden via the same `:where()` pattern, collapse each visible
row into a label:value card) rather than inventing a separate "tap to
expand details" affordance layered on top of the tree's own expand/collapse
— a card that's *both* tree-expandable (reveals children) and
detail-expandable (reveals other columns) creates two different meanings
for "expand" on the same element, which is a real source of confusion.

- **Depth/hierarchy** loses its natural home (cell indentation) once a row
  becomes a stacked card. Represent it instead as a graduated left
  border/padding on the whole card, scaled by `aria-level` — nesting stays
  visually legible without needing table columns.
- **Many columns per row**: if a row commonly has more columns than fit
  comfortably in a card, show only the primary column + expand/collapse
  toggle by default, with the remaining columns behind a `<details>`-style
  disclosure *within* that card — the same technique DataTable already uses
  for its filter toolbar. This is a single, clearly-secondary disclosure
  ("show details"), not a competing "expand," so it doesn't create the
  ambiguity above.
- The tree's own expand/collapse toggle (children visibility) remains the
  only "expand" concept that affects what rows exist at all; the details
  disclosure only affects how much of one row's own data is shown.

  **v1 status**: not built. The shipped `@container` narrow-width block
  stacks every column in the card unconditionally, same as DataTable, rather
  than adding the "show details" disclosure described above. Accepted as a
  deliberate v1 cut rather than real follow-up work — the risk this section
  called out (a competing "expand" affordance next to the tree's own
  expand/collapse) is exactly the kind of interaction-model risk worth
  getting right rather than shipping quickly, and no current consumer
  (including this library's own docs site) has hit a many-column TreeTable
  narrow enough for it to matter yet. Revisit if a real use case surfaces
  rows with enough columns that the unconditional stack becomes unwieldy.
