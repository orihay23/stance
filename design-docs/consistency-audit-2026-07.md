# Full codebase consistency audit — 2026-07

Scope: every component in `packages/core/src/components`, every composable in
`src/composables`, the shared utils, `style.css`, the theme package, all unit
tests, and the two design docs. Audit-only; no code changed in this pass.

Verification notes (mechanical checks, not spot checks):
- `!important`: **zero occurrences** in any source file (the only hits are the
  per-component tests that assert its absence).
- Raw color literals outside `var()` fallbacks: **zero** in `packages/core`.
- Every selector in every `<style>` block is `:where()`-wrapped (the only
  unwrapped constructs are `@keyframes`/`@media`/`@container` at-rules and
  `::before`/`::-webkit-details-marker` pseudo-elements appended *after* a
  `:where()`, which can't live inside it and add no class specificity).
- Every exported component that accepts `class` routes it through `cn()`
  (tailwind-merge). No exceptions found.

---

## Tier 1 — real bugs / accessibility regressions

### 1.1 DatePicker references a token that doesn't exist: `--stance-color-danger`
`DatePicker.vue:504` — `color: var(--stance-color-danger, currentColor)` for
`[aria-invalid="true"]`. The theme system (`packages/themes/src/types.ts`,
`compile.ts`, `neutral.ts`) defines `destructive`, never `danger` — confirmed
by grepping the whole repo: this is the only occurrence of "danger". The
fallback is `currentColor`, so the invalid/parse-error state produces **no
visual change at all** in every theme.
**Fix:** use `--stance-color-destructive` like every other component.

### 1.2 DatePicker in-range day cells render text at 16% opacity
`DatePicker.vue:649-653` — `[data-in-range]` sets `background:
var(--stance-color-primary); opacity: 0.16` on the *whole cell*, so the day
number itself is at 16% opacity: unreadable, and a hard WCAG contrast failure
for every day strictly inside a selected range (endpoints are rescued by
`[data-selected] { opacity: 1 }`).
**Fix:** make only the background translucent (e.g. `color-mix(in oklch,
var(--stance-color-primary) 16%, transparent)` or a dedicated subtle token),
never element opacity.

### 1.3 Clicking the DatePicker text input opens the modal calendar and steals focus
`DatePicker.vue:275-277` (`onFieldClick` on the whole field wrapper, line 353)
+ the always-modal dialog (`aria-modal`, `pushBackgroundInert`, `useFocusTrap`
with `initialFocus` on a grid cell). Mouse-clicking the input to *type* a date
— a flow the props doc explicitly supports ("Typed text that doesn't parse…")
— immediately yanks focus into the focus-trapped calendar grid. Typing is only
reachable by keyboard-Tab or after Escape.
**Fix:** open the calendar from the trigger button / ArrowDown only; don't
open on clicks that land on the input (at minimum in `mode="single"`).

### 1.4 Tooltip content is not hoverable (WCAG 1.4.13)
`Tooltip.vue:594` — `.stance-tooltip__content { pointer-events: none }` while
`mouseleave` on the trigger hides the tooltip (default `closeDelay: 0`).
Moving the pointer from trigger to bubble dismisses it, so users can never
reach/select the content — 1.4.13 requires hover-persistent content. The code
even includes `contentRef` in `useDismissable`'s containers, suggesting
hover-persistence was intended.
**Fix:** drop `pointer-events: none`, keep open while the pointer is over the
bubble (mouseenter on content cancels the hide timer).

### 1.5 `v-model:pageSize` on DataTable is a documented no-op
`DataTable.vue:76` documents "v-model:pageSize", `:129` declares the emit —
but nothing in DataTable or `DataTablePagination.vue` ever emits
`update:pageSize` (grep-confirmed). There is no page-size selector UI. A
consumer binding `v-model:pageSize` gets a dead binding, silently.
**Fix:** either add a page-size `<Select>` to `DataTablePagination.vue`, or
remove the emit and re-document `pageSize` as a plain prop.

### 1.6 TreeTable expand/collapse via keyboard is likely silent to screen readers
`TreeTable.vue:519-566` — `aria-expanded` lives on the `<tr>` and on the
`tabindex="-1"` disclosure button, but during ArrowRight/ArrowLeft/Enter
expand-collapse the *focused element is the `<td>`*, which carries no
`aria-expanded`. Screen readers reliably announce `aria-expanded` changes on
the focused element; a change on an ancestor row is hit-or-miss. The design
doc (`treetable.md` §2) specifies the keyboard model but doesn't resolve where
the announcement comes from.
**Fix:** mirror `aria-expanded` onto the primary-column gridcell (permitted on
`gridcell` in treegrids), or `announce()` "row expanded/collapsed" via the
shared live region.

### 1.7 AccordionContent's `aria-labelledby` does nothing (no role)
`AccordionContent.vue:559-564` — the panel div gets `aria-labelledby` but no
`role`. `aria-labelledby` on a role-less generic div has no effect; the APG
accordion pattern's panel wiring assumes `role="region"`.
**Fix:** add `role="region"` to the panel (matches AccordionHeader's
`aria-controls` contract; fine at this panel count).

---

## Tier 2 — inconsistency / technical debt

### 2.1 DataTable ↔ TreeTable duplication has hit the design doc's "revisit" threshold
`treetable.md` §1 accepted "some UI boilerplate" in two places. What's
actually duplicated near-verbatim across `DataTable.vue`/`TreeTable.vue` now:
`defaultCompare`, `toggleSort`, `ariaSortFor`, `filterTypeFor` +
`hasActiveFilters` + per-column filter get/set, the whole filter-toolbar
template (global search + `<details>` collapse at >4 columns), the debounced
filter-count `announce()` watcher, the manual `RADIO_GROUP_KEY` provide block,
select-all scoping logic, the sort-button/sort-icon markup, the visually-
hidden CSS, and the narrow-container card-collapse CSS. That's beyond
boilerplate — a behavior fix in one (e.g. the announce debounce) now silently
misses the other.
**Fix (follow-up phase):** extract `useTableFilters()`, `useTableSort()`, and
small internal subcomponents (`SortHeaderButton.vue`, `TableFilterToolbar.vue`);
keep the column *types* separate per the design doc's reasoning.

### 2.2 Visually-hidden CSS is copy-pasted five times
`Badge.vue` (`__visually-hidden`), `Breadcrumb.vue`, `DataTable.vue`
(caption + vh), `TreeTable.vue`, and inline in `utils/live-region.ts`.
**Fix:** one shared `.stance-visually-hidden` rule in `style.css` (and use it
from `live-region.ts`).

### 2.3 The invalid/error-slot wiring pattern is copy-pasted seven times
`Input.vue`, `Checkbox.vue`, `Switch.vue`, `Select.vue`, `Textarea.vue`,
`RadioGroup.vue`, `ToggleGroup.vue` each re-implement identical
`generatedId/errorId/showError/describedBy` computeds, the trailing error
`<p>`, and identical error CSS.
**Fix:** a `useErrorSlot()` composable (+ optionally a tiny `FieldError.vue`).

### 2.4 PopoverTrigger and DropdownMenuTrigger are near-identical forks
Both re-create Button's look by borrowing the `.stance-button` class and
re-declaring `variant`/`size` props instead of wrapping `Button.vue`; the
ref-forwarding/cleanup code is line-for-line the same
(`PopoverTrigger.vue:276-291` vs `DropdownMenuTrigger.vue:78-99`).
**Fix:** a shared internal trigger base (or render `<Button>` internally);
also decouples them from Button's private class contract.

### 2.5 Overlay boilerplate repeated across five components
The floating-ui setup (`offset/flip/shift({padding: 8})` + `autoUpdate`), the
`detectThemeContext` ref-and-watch, and the "inert before focus-restore"
ordering (with the same explanatory comment pasted three times) appear in
`PopoverContent.vue`, `DropdownMenuContent.vue`, `Tooltip.vue`,
`DatePicker.vue`, and (partially) `Dialog.vue`.
**Fix:** `useFloatingOverlay()` and `useOverlayThemeContext()` composables;
fold the inert push/pop + ordering guarantee into a `useModalBackground()`.

### 2.6 `closeOnScroll` in useDismissable is dead code
`useDismissable.ts:16,44` — documented as "relevant for Popover/Tooltip", but
no caller anywhere passes it (all overlays track position via `autoUpdate`
instead). Behavior is consistent *because* nobody uses it.
**Fix:** remove the option, or wire it up where the doc says it belongs.

### 2.7 DatePicker skips the shared invalid/error conventions
Unlike every other form control, `DatePicker.vue` has no `error` slot, no
`aria-describedby` wiring for its parse-error state, and its field focus style
(`:focus-within` outline offset 2, no border-color change, line 484) differs
from the Input/Select wrapper convention (offset 1 + `border-color:
var(--stance-color-ring)`).
**Fix:** adopt the same `useErrorSlot()` pattern (2.3) and Input's focus-within
recipe.

### 2.8 ToggleGroup is missing `required` where RadioGroup has it
`RadioGroup.vue` exposes `required` and sets `aria-required`; `ToggleGroup.vue`
— the same native-radio-group trick with the same context shape otherwise —
has no `required` at all (and its context type omits it,
`useToggleGroup.ts`). Not documented as intentional.
**Fix:** add `required` for parity, or document the omission.

### 2.9 Breadcrumb hand-rolls menu items instead of using DropdownMenuItem
`Breadcrumb.vue:713-723` renders raw `<a role="menuitem" tabindex="-1"
class="stance-dropdown-menu__item">` inside `DropdownMenuContent`. Arrow-key
nav works (the content queries `[role="menuitem"]`), but: Space does nothing
(bare anchors only activate on Enter), clicking doesn't close the menu (no
`setOpen(false)` path), it reaches into DropdownMenu's private class, and
`:key="item.label"` breaks on duplicate labels.
**Fix:** give `DropdownMenuItem` an `href`/`as="a"` form and use it here.

### 2.10 Fixed dimensions are systematically hardcoded (density isn't themeable)
CLAUDE.md says themes vary "radius/shadow/density too", but control geometry
is literal rems everywhere: Button min-heights/icon widths
(`Button.vue:129-156`), Checkbox/Radio 1.25rem boxes, Switch 2.5×1.25rem
track + thumb translate, Avatar size scale, ProgressBar 0.5rem track,
DatePicker 18rem dialog / 2rem cells, overlay max-widths (Dialog 32rem,
Popover 20rem, Tooltip 16rem, menu 10rem, Toast 18/24rem). It's *consistent*
(every component does it the same way), so this is debt, not drift — but a
"compact" theme is currently impossible.
Smaller one-offs in the same family: `Badge.vue` `line-height: 1.25` (should
be `--stance-leading-tight`), ToggleGroup's `0.125rem` padding/gap, and the
`0.15s ease` transition literal in ~15 components (a `--stance-motion-*`
token would centralize it and simplify a global reduced-motion story).
**Fix (if density is a real theme axis):** introduce `--stance-control-*` size
tokens; otherwise write the decision down in CLAUDE.md so it stops looking
like drift.

### 2.11 PopoverTrigger advertises `aria-haspopup="dialog"` for non-modal content
`PopoverTrigger.vue:303` always sets `aria-haspopup="dialog"`, but
`PopoverContent.vue:400` only applies `role="dialog"` when `modal` — the
default non-modal popover opens a role-less div, so AT is promised a dialog
that never appears.
**Fix:** make `haspopup` reflect the popover's `modal` prop (or give
non-modal content an appropriate role and drop the mismatch).

---

## Tier 3 — flagged for judgment (not sure these are problems)

### 3.1 Sort changes aren't announced in either table
DataTable/TreeTable announce filter results and page changes via
`useLiveAnnouncer`, but a sort only updates `aria-sort` (announced when the
header itself is focused — which it is, since sorting is click/Enter on that
button). This is APG-standard and *consistent* across both tables; strictly,
though, the reordered results themselves are a silent change. Decide whether
"Sorted by X, ascending" announcements are wanted — if yes, do it in the
shared sort composable from 2.1.

### 3.2 Radio.test.ts and ToggleGroupItem.test.ts skip the axe + theme matrix
Every other component test file has the `describe.each(themes)` axe block with
light + dark runs; these two only have the `!important`/`:where()` checks.
Real axe coverage arguably exists via `RadioGroup.test.ts`/`ToggleGroup.test.ts`
(which render the children), but the file-level norm is broken — worth either
adding the blocks or a comment saying the group test owns it.

### 3.3 The "8 combinations" DoD is currently a 1×2 matrix everywhere
Only `neutral` exists; every test's `const themes = [neutral]` array and the
visual-test registry both scale automatically when more themes land. Not
drift — but flagging that no test would fail today if a second theme shipped
without being added to those arrays (the wiring is per-file arrays, not a
central "all themes" export). A shared `allThemes` export from
`@stance-dev/themes` would make theme #2 automatically covered.
Known, documented visual gaps (visual-testing.md §5): Grid has no dark-mode
story; Toast dark-mode can't be captured with the current story structure.

### 3.4 TreeTable's narrow-card "details disclosure" from the design doc wasn't built
`treetable.md` §4 specifies that many-column rows collapse to "primary column
+ expand toggle, remaining columns behind a `<details>`-style disclosure
within the card". The implementation (`TreeTable.vue` `@container` block)
shows *all* columns stacked, same as DataTable. Decide: deliberate v1 cut
(then note it in the doc) or follow-up work.

### 3.5 rowKey fallback-to-index can silently collide
Both tables fall back to the row *index* when `rowKey` doesn't resolve to a
string/number (`DataTable.vue:150-154`, `TreeTable.vue:106-110`). Under
pagination the index restarts per page, and in TreeTable per sibling group —
so two different rows can share a selection key. Cheap dev-mode warning would
cover it.

### 3.6 Accordion/Tabs vs TreeTable model naming
Accordion's open item(s) and Tabs' active tab are the *default* `modelValue`,
while TreeTable's expansion is `v-model:expanded`. The implicit rule ("a
component's single primary state is modelValue; multi-state components use
named models") is coherent — DataTable/TreeTable have no default model at all
— but it's nowhere written down. Document the rule; no code change needed.

### 3.7 CLAUDE.md promises a `class`/`ui` prop; only `class` exists
No component has a per-part `ui` prop; multi-part components expose exactly
one class target (Dialog: panel; DataTable/TreeTable: root; Toast: root).
Consistent as-is, but e.g. Dialog's backdrop and the tables' internals aren't
reachable without global CSS. Either build `ui` or trim it from CLAUDE.md.

### 3.8 useLiveAnnouncer is a pass-through, and Toast's exception is intentional
Confirming the audit question directly: DataTable, TreeTable, and DatePicker
all announce through the single shared `utils/live-region.ts` mechanism; Toast
deliberately does not (each toast is its own `role="status"`/`"alert"` live
region), and that decision is documented in `useLiveAnnouncer`'s docstring.
The composable itself is a one-line re-export of `announce` — fine, but it
exists mainly as documentation.

---

## Direct answers to the four "confirm it holds" questions

1. **Composable reuse — holds.** `useFocusTrap`: Dialog (always),
   PopoverContent (`trapTab: modal`), DropdownMenuContent (`trapTab:
   openedViaKeyboard` — i.e. keyboard-opened menus trap, mouse-opened don't),
   DatePicker (always). No local reimplementation anywhere.
   `useDismissable`: Dialog, PopoverContent, Tooltip (outside-click disabled),
   DropdownMenuContent, DatePicker — all five, one implementation; Escape and
   outside-click behavior is uniform; scroll-dismiss is uniformly *unused*
   (see 2.6). `useLiveAnnouncer`: see 3.8. New duplication candidates that
   *should* be shared: 2.1–2.5 above.
2. **Styling conventions — hold, with the exceptions listed.** No
   `!important` (verified + test-enforced per component). `:where()` used
   everywhere, including the narrow-container overrides, which correctly rely
   on source order at specificity 0 (and say so in comments). Token
   discipline holds for color with exactly one violation (1.1) and one
   opacity misuse (1.2); dimension literals are systematic (2.10).
   `cn()`/tailwind-merge: universal where `class` is accepted.
3. **Prop conventions — hold.** Git history confirms every mode prop added
   post-ship defaults to the pre-existing behavior: `paginationMode: "none"`,
   `selectionMode: "none"`, `manualSort`/`manualFilter: false`, filters
   default off (pagination/selection/filtering were all added to DataTable
   after its initial sorting-only commit). Grid shipped with both responsive
   modes and `container` default day one. `v-model:selected` is row *keys* in
   both tables (nothing uses row objects); `v-model:expanded` matches the
   TreeTable design doc. The only naming wrinkle is 3.6; the only dead model
   is 1.5.
4. **A11y pattern consistency — mostly holds.** TreeTable implements the
   column-dependent arrow-key model exactly as specified (both halves);
   `aria-sort` present in both tables; Tabs use the documented automatic
   activation with roving tabindex; focus-visible styling is genuinely the
   same token everywhere (`outline: 2px solid var(--stance-color-ring,
   currentColor)`) with only context-appropriate offset differences (inset
   -2 for flush elements like Tab/ToggleGroupItem/treegrid cells; +2
   elsewhere; DropdownMenuItem intentionally uses `:focus` highlight per menu
   convention). Dynamic-change announcements hold for filters, pagination,
   and DatePicker range selection; the gaps are 1.6 (tree expand/collapse)
   and the judgment call in 3.1 (sort).
5. **Testing gaps — small.** All 27 component test files run axe inside a
   compiled-theme wrapper in light *and* dark except the two in 3.2. Matrix
   breadth is bounded by there being one theme (3.3), not by missing tests.
   Edge-case symmetry across similar components is good: every control with
   `invalid` wiring (Input, Checkbox, Switch, Select, Textarea, RadioGroup,
   ToggleGroup, DatePicker) has invalid-state tests. The `!important` +
   `:where()` source assertions are present in every component's suite.
