# Combobox design doc

Status: proposed, not yet implemented. Written ahead of implementation per
CLAUDE.md's TreeTable precedent — Phase 12 (Combobox), given multi-select
combobox has no canonical APG worked example and the two reference
libraries checked against (Reka UI, Ark UI) genuinely diverge on tag/removal
semantics. No component code in this pass.

## 1. API shape

**Confirmed: Reka's `v-model` + slotted-items outer shape, Ark's
first-class async states underneath.** One component family, not two.

- `Combobox` (root — provides context, owns `v-model`), `ComboboxInput` (the
  text input), `ComboboxContent` (portaled popup, `role="listbox"`),
  `ComboboxOption` (`role="option"`, one per selectable item). This is the
  same four-piece shape as `DropdownMenu`/`DropdownMenuTrigger`/
  `DropdownMenuContent`/`DropdownMenuItem` and `Popover`/`PopoverTrigger`/
  `PopoverContent` — deliberately, so it reads like the same library rather
  than a one-off pattern.
- **Deliberate deviation from that precedent**: no separate `ComboboxTrigger`.
  In a combobox the text input *is* the trigger — typing opens the popup,
  and giving it a second, distinct trigger element would just be dead
  weight copied from DropdownMenu's shape without DropdownMenu's reason for
  having one (DropdownMenu's trigger is a plain button unrelated to text
  entry). Flagging this as a judgment call, not an oversight.
- No `ComboboxLabel` sub-component. Every existing form control in this
  library (`Input`, `Select`, `Textarea`, `NumberField`) is labeled by the
  consumer's own `<label for>` pointed at an `id` prop / auto-generated
  `useId()` — Combobox follows that, rather than inventing a labeling
  convention none of its siblings use.
- **Single vs. multi-select is one component with a `multiple` prop**, not
  two components, per the request. Per CLAUDE.md's model-naming convention
  (a component's single primary piece of state defaults to `modelValue`):
  `modelValue: string` when `!multiple`, `modelValue: string[]` when
  `multiple` — selection *is* Combobox's primary state either way, so this
  isn't a case for a named `v-model` the way TreeTable's `expanded` was.
  `multiple` also changes commit-on-select behavior, not just the value
  type (see §3).
- **Push-back on one implicit assumption: Combobox does not own filtering.**
  `ComboboxOption` children are always exactly what's rendered — the
  consumer's own `v-for` over their own (already-filtered) array, same as
  `DropdownMenuItem`. There's no built-in `options` + label-matcher prop
  that does substring filtering internally. Reasoning: C2 (async) requires
  consumer-driven filtering by construction — the consumer's fetch already
  returns only matching results — so a built-in sync-only filter mode would
  be a second code path that only ever serves half of Combobox's stated use
  cases, mirroring the exact reason DataTable exposes `manualFilter` as an
  escape hatch rather than *always* filtering client-side. Here there's no
  convenience default to preserve, so it's simpler to just always be
  "manual": one behavior, sync and async both drive it identically (a
  `computed` narrowing a local array for sync, a debounced fetch result for
  async — from Combobox's point of view both are just "the children
  changed"). This is also what makes `useActiveDescendant` filtering-
  agnostic for free (§2).
- Popup anchoring: reuse `useFloatingOverlay` as-is (same composable
  DropdownMenu's content already uses), width-matched to the input via CSS
  rather than Floating UI's `size` middleware, matching Select's existing
  native-popup width behavior. No new anchoring code.
- Async states are first-class props/slots on `ComboboxContent`, not an
  afterthought layered in later: `loading: boolean` and `error: string |
  undefined` props, plus `loading`/`empty`/`error` slots — same three-state
  shape DataTable already uses for its `loading`/`empty` slots, extended
  with `error` since Combobox's async case (a live search-as-you-type
  fetch) fails in the ordinary course of use in a way DataTable's mostly
  doesn't. `empty` fires whenever zero `ComboboxOption`s are registered and
  neither `loading` nor `error` is set — the same slot serves "your sync
  array filtered to nothing" and "the server returned no matches," which is
  correct: a user typing in the box shouldn't be able to tell which case
  they're in, so the UI shouldn't either.
- Freeform entry (committing typed text that doesn't match any option, e.g.
  to create a new tag) is out of scope for v1. That's a genuinely different
  interaction model (Combobox here is select-with-search, not
  search-or-create) and folding it in now would widen the multi-select ARIA
  question in §3 further before it's even settled. Revisit only if a real
  use case surfaces — same posture TreeTable's doc took on its narrow-card
  disclosure.

## 2. The `useActiveDescendant` composable

Signature (illustrative, not final):

```ts
useActiveDescendant(options: {
  itemIds: ComputedRef<string[]>;      // ids of currently-registered options, in DOM order
  isDisabled?: (id: string) => boolean;
  loop?: boolean;                       // @default true
}): {
  activeId: ComputedRef<string | null>;
  moveNext(): void;
  movePrev(): void;
  moveFirst(): void;
  moveLast(): void;
  setActive(id: string | null): void;
  reset(): void;                        // clears active id — call on close, or when itemIds changes out from under it
  onKeydown(event: KeyboardEvent): void; // ArrowUp/ArrowDown/Home/End only
}
```

- **Deliberately mirrors `useDragValue`'s split from Phase 11**: just as
  `useDragValue` owns only the pointer/keyboard *plumbing* and leaves all
  value-math to the caller, `useActiveDescendant` owns only the *index*
  state machine (current position, wrap-around, clamping when the list
  shrinks) and leaves all DOM concerns — id→element lookup, `scrollIntoView`,
  actually rendering a highlight style — to the caller. It never touches
  the DOM itself. This keeps it unit-testable the same way `fractionToValue`
  is: pure index math over a plain string array, no real elements needed.
- **"Typeahead-independent filtering" means it has zero typeahead logic**,
  unlike `DropdownMenuContent`'s existing character-buffer jump-to-match.
  That's deliberate, not a gap: Combobox's text input already *is* a full
  substring filter, strictly more powerful than a single-character jump, so
  bolting DropdownMenu-style typeahead on top would be redundant and could
  fight with normal typing. `useActiveDescendant` doesn't know or care *why*
  `itemIds` changed length (user typed a filter character, an async fetch
  resolved, an option was disabled) — it just re-clamps the active index
  against whatever list it's handed. This is what makes it reusable, not
  Combobox-specific: a future Command palette drives its own fuzzy filter
  and hands the resulting id list to the same composable; a future
  standalone `Listbox` (no text input at all, just arrow-key + typeahead
  browsing) is the one place actual typeahead would still make sense — and
  it would live in `Listbox` itself, layered on top of this composable, not
  inside it.
- Built shared from day one for exactly this reason — it's the "missing
  half" the request called out, and retrofitting index-management logic out
  of a Combobox-specific implementation later (the way `useDragValue` had
  to be extracted out of Splitter after the fact) is strictly more work
  than designing it standalone now that the need is already known.
- **`useDismissable` applies as-is, confirmed.** Escape and outside-click
  close `ComboboxContent`, `containers: [inputWrapperRef, contentRef]`,
  exactly like `DropdownMenuContent`'s usage. One layered nuance that stays
  entirely inside `Combobox`/`ComboboxInput`, not in `useDismissable`
  itself: a first Escape while the input has typed text clears the text
  (and keeps the popup open) rather than closing it, via a local
  `@keydown.escape` on the input that `stopPropagation()`s when it swallows
  that first press — `useDismissable`'s own document-level Escape listener
  then only ever sees the "close" case. No change to `useDismissable`
  needed for this.
- **`useFocusTrap` is deliberately NOT used — stated explicitly so a future
  contributor doesn't "fix" this.** APG 1.2's single-select combobox
  pattern requires DOM focus to stay on the input the entire time; the
  currently-highlighted option is conveyed purely via
  `aria-activedescendant`, never by moving real focus onto it.
  `useFocusTrap` moves DOM focus into its `container` on activation
  (`target.focus()` in its `watch` — see `useFocusTrap.ts`) and restores it
  on deactivation; wiring `ComboboxContent` up as that container would pull
  focus off the input the instant the popup opens, breaking the
  activedescendant model outright and turning every option into something
  that has to be independently focusable (which is exactly the roving-
  DOM-focus model `DropdownMenuContent` uses, and exactly what combobox is
  not). If a future contributor hits a bug where Tab doesn't do something
  they expect inside the popup, the fix is not adding a focus trap here.
- **`useLiveAnnouncer` covers two things, both reusing the *pattern* — not
  the composable — `useTableFilters` uses for its debounced result-count
  announcement.** `useTableFilters` itself isn't a good import target here
  (it's column/table-filter-shaped: `filterableColumns`, `columnFilterId`,
  etc. — none of that applies), so Combobox reimplements the same
  400ms-debounced-`setTimeout` mechanic locally, calling the shared
  `announce()` from `useLiveAnnouncer` at the end of it, same as
  `useTableFilters.announceResultCount` does. Two call sites: "N options
  available" on every `itemIds` length change (debounced, so fast typing
  doesn't spam announcements), and tag add/remove in multi-select mode (§3,
  *not* debounced — each one is a discrete user action, not a stream of
  keystrokes).

## 3. The multi-select ARIA question — resolved

Single-select is settled and unremarkable: input keeps real DOM focus,
`role="combobox"` lives on the `<input>`, `aria-expanded`/`aria-controls`
point at the listbox, `aria-activedescendant` tracks the highlighted
option, Enter commits the highlighted option (sets `modelValue`, fills the
input with its label, closes the popup). Multi-select needed an actual
decision. Resolved as follows, with reasoning per the request:

- **Selected options stay in the listbox and stay toggleable — Ark's model,
  not "selecting removes it from the list."** `ComboboxContent` gets
  `aria-multiselectable="true"`; each `ComboboxOption` carries real
  `aria-selected` state as the source of truth for "is this selected,"
  exactly like a standard ARIA multi-selectable listbox. Selecting an
  already-selected option toggles it off. **Selecting does not close the
  popup and does not commit-and-clear** the way single-select does — the
  point of multi-select is picking several without re-opening the popup
  each time. The input's typed text *does* clear after each selection,
  ready for the next filter term (also Ark's behavior).
- **Tags: plain markup, not `role="list"`/`role="listitem"`, and not a
  `role="grid"` of roving tags either.** Each selected value renders as
  `<span class="stance-combobox__tag">{label}<button aria-label="Remove
  {label}">…</button></span>` in a plain (non-semantic-list) wrapper before
  the input. Two real alternatives were weighed and rejected:
  - `role="list"`/`role="listitem"` announces "list of N items" navigation
    to AT, which is the wrong mental model for a set of controls whose
    *actual* source of truth is the `aria-selected` state back on the
    listbox options — the tags are a presentational reflection of that
    state, not a second selection mechanism, and giving them list semantics
    implies otherwise.
  - `role="grid"` with roving tabindex + arrow-key navigation between tags
    (react-aria's `TagGroup` approach) is more sophisticated but adds a
    *second* full keyboard model on top of the combobox's own
    activedescendant model and the input's native text-editing keys — real
    risk of the two fighting over ArrowLeft/ArrowRight at the start/end of
    the input's text. Each tag's delete button is already reachable two
    ways without that risk: Tab (plain tab order, no custom keyboard model
    to build, test, or document) and Backspace-on-empty-input (below).
    Simpler wins for v1; revisit only if real usage demands the grid-of-tags
    power-user path — same "revisit if it surfaces" posture as TreeTable's
    narrow-card disclosure cut.
- **Backspace on an empty input removes the last tag immediately** — no
  two-step "select, then confirm" — matching Reka's default and the
  extremely well-established chip-input convention (Gmail's To: field,
  Slack's user picker, etc.). Flagging this as the one place a
  lower-friction alternative (select-then-delete, to guard against
  accidental removal while typing) was seriously considered and rejected:
  the two-step version protects against a mistake this pattern's users
  essentially never make in practice (Backspace on an already-empty input
  is not something you do by accident while still typing a filter term),
  and it would mean Backspace's behavior depends on hidden state
  (whether the last tag is "armed") that has no visual cue for sighted
  users either. DOM focus stays on the input throughout — only the tag list
  and `modelValue` change, no focus movement.
- **Tag add/remove is announced explicitly via `useLiveAnnouncer`**, not
  left to ambient DOM-mutation detection. Removing a tag (Backspace or its
  delete button) announces `"{label} removed. {N} selected."`; selecting a
  new option in multi-select mode announces `"{label} added. {N}
  selected."` — same phrasing register as `useTableFilters`'s "N results
  match your filters." This is necessary, not belt-and-suspenders: the
  option whose `aria-selected` just changed lives inside a listbox that may
  be scrolled out of view or (after the popup closes) not even in the
  accessibility tree, and a tag appearing/disappearing in the DOM is a
  silent visual-only change without an explicit announcement — screen
  reader users would otherwise have no reliable signal that the action
  registered at all.

## 4. Scope: v1 phasing (C1–C4)

Confirmed, phasing as proposed — each step independently shippable,
roughly DatePicker-sized or smaller:

- **C1**: `useActiveDescendant` (standalone, unit-tested on plain string
  arrays per §2) + single-select synchronous `Combobox`/`ComboboxInput`/
  `ComboboxContent`/`ComboboxOption`. Options known upfront via the
  consumer's own `v-for` (§1 — no built-in filter mode). Full
  `aria-activedescendant` flow, `useFloatingOverlay` anchoring,
  `useDismissable` reuse, Arrow/Home/End/Enter/Escape, disabled options,
  the debounced "N options available" announcement.
- **C2**: async states — `loading`/`error` props, `loading`/`empty`/`error`
  slots on `ComboboxContent` (§1). Consumer owns the actual fetch/debounce
  of their query (same division of responsibility as DataTable's manual
  pagination/filter modes: the component owns the state *contract*, not the
  async logic itself). No new composable needed — this is prop/slot surface
  on top of C1.
- **C3**: `multiple` prop, tags, and the resolved ARIA model from §3. Tag
  rendering lives inside `Combobox` itself for v1 — **not** a standalone
  public `TagsInput`, per the request. If a non-combobox freeform-tag-entry
  use case shows up later, split the tag-rendering internals out then; done
  now it'd be speculative (the exact YAGNI reasoning TreeTable's doc used
  for not extracting shared DataTable/TreeTable internals preemptively).
- **C4**: Command palette — `Dialog` + this listbox machinery
  (`useActiveDescendant` driving the palette's own fuzzy-filtered results)
  + `useLiveAnnouncer` for result counts. Explicitly deferred until C1–C3
  exist: building it earlier would mean either duplicating
  `useActiveDescendant`'s index logic ad hoc (defeating the point of
  extracting it now) or building it as a second, parallel Combobox with
  extra Dialog chrome — not a meaningfully different component.
