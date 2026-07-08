import type { ComputedRef } from "vue";
import { computed, ref } from "vue";

export interface UseActiveDescendantOptions {
  /** ids of currently-registered items, in visual/DOM order. Reactive — shrinking/growing (e.g. a combobox filter narrowing the list) is handled for free. */
  itemIds: ComputedRef<string[]>;
  isDisabled?: (id: string) => boolean;
  /** @default true */
  loop?: boolean;
}

export interface UseActiveDescendantResult {
  /** The currently-highlighted id, or `null` when nothing is highlighted (including when a previously-active id has fallen out of `itemIds`). */
  activeId: ComputedRef<string | null>;
  moveNext(): void;
  movePrev(): void;
  moveFirst(): void;
  moveLast(): void;
  /** Sets the active id directly (e.g. on pointer hover), bypassing `isDisabled`. Pass `null` to clear. */
  setActive(id: string | null): void;
  reset(): void;
  /** Convenience handler for ArrowUp/ArrowDown/Home/End — a consumer whose list lives inside a text input (Combobox) should call the individual methods above instead, since Home/End there needs to stay native text-cursor movement. */
  onKeydown(event: KeyboardEvent): void;
}

/**
 * Shared "virtual focus" index management for any widget that highlights
 * one item via `aria-activedescendant` while real DOM focus stays
 * elsewhere (Combobox's text input, a future Command palette, a future
 * standalone Listbox) — the roving-tabindex counterpart to those widgets,
 * which move real `.focus()` between real elements (DropdownMenuContent)
 * instead.
 *
 * Deliberately owns only index math, the same split `useDragValue` (Phase
 * 11) makes for pointer/keyboard drag plumbing: no DOM refs, no
 * `scrollIntoView`, no rendering. The caller maps `activeId` to an element
 * (for `scrollIntoView`/highlight styling) and owns *why* `itemIds` changed
 * — this composable only knows the list did, and re-clamps against it.
 * Has no typeahead of its own: Combobox's input already is a full-text
 * filter, so bolting a single-character jump on top would be redundant.
 */
export function useActiveDescendant(options: UseActiveDescendantOptions): UseActiveDescendantResult {
  const rawActiveId = ref<string | null>(null);
  const loop = options.loop ?? true;

  // Deriving the index from `rawActiveId` (rather than storing the index
  // itself) means a shrinking/reordered `itemIds` self-heals for free: if
  // the previously-active id is no longer present, `indexOf` returns -1 and
  // `activeId` below resolves to `null` on its own, with no watcher needed.
  const activeIndex = computed(() => {
    if (rawActiveId.value === null) return -1;
    return options.itemIds.value.indexOf(rawActiveId.value);
  });

  const activeId = computed<string | null>(() => (activeIndex.value === -1 ? null : rawActiveId.value));

  function isDisabled(id: string): boolean {
    return options.isDisabled?.(id) ?? false;
  }

  /** Scans from `start` (inclusive) in `direction`, wrapping if `loop`, returning the first enabled index found or -1. */
  function findEnabledFrom(start: number, direction: 1 | -1): number {
    const ids = options.itemIds.value;
    const length = ids.length;
    if (length === 0) return -1;
    for (let step = 0; step < length; step++) {
      let i = start + direction * step;
      if (loop) {
        i = ((i % length) + length) % length;
      } else if (i < 0 || i >= length) {
        return -1;
      }
      if (!isDisabled(ids[i]!)) return i;
    }
    return -1;
  }

  function moveNext(): void {
    const next = findEnabledFrom(activeIndex.value + 1, 1);
    if (next !== -1) rawActiveId.value = options.itemIds.value[next]!;
  }

  function movePrev(): void {
    const from = activeIndex.value === -1 ? options.itemIds.value.length : activeIndex.value;
    const prev = findEnabledFrom(from - 1, -1);
    if (prev !== -1) rawActiveId.value = options.itemIds.value[prev]!;
  }

  function moveFirst(): void {
    const first = findEnabledFrom(0, 1);
    if (first !== -1) rawActiveId.value = options.itemIds.value[first]!;
  }

  function moveLast(): void {
    const last = findEnabledFrom(options.itemIds.value.length - 1, -1);
    if (last !== -1) rawActiveId.value = options.itemIds.value[last]!;
  }

  function setActive(id: string | null): void {
    rawActiveId.value = id;
  }

  function reset(): void {
    rawActiveId.value = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveNext();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      movePrev();
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFirst();
    } else if (event.key === "End") {
      event.preventDefault();
      moveLast();
    }
  }

  return { activeId, moveNext, movePrev, moveFirst, moveLast, setActive, reset, onKeydown };
}
