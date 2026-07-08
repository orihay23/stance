import { computed, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useActiveDescendant } from "./useActiveDescendant";

describe("useActiveDescendant", () => {
  it("starts with no active id", () => {
    const { activeId } = useActiveDescendant({ itemIds: computed(() => ["a", "b", "c"]) });
    expect(activeId.value).toBeNull();
  });

  it("moveNext from none active moves to the first item", () => {
    const { activeId, moveNext } = useActiveDescendant({ itemIds: computed(() => ["a", "b", "c"]) });
    moveNext();
    expect(activeId.value).toBe("a");
  });

  it("moveNext/movePrev step through items and wrap by default", () => {
    const { activeId, moveNext, movePrev } = useActiveDescendant({ itemIds: computed(() => ["a", "b", "c"]) });
    moveNext();
    moveNext();
    expect(activeId.value).toBe("b");
    moveNext();
    expect(activeId.value).toBe("c");
    moveNext(); // wraps
    expect(activeId.value).toBe("a");
    movePrev(); // wraps the other way
    expect(activeId.value).toBe("c");
  });

  it("does not wrap when loop is false", () => {
    const { activeId, moveNext, moveLast } = useActiveDescendant({
      itemIds: computed(() => ["a", "b", "c"]),
      loop: false,
    });
    moveLast();
    expect(activeId.value).toBe("c");
    moveNext(); // no next item — stays put
    expect(activeId.value).toBe("c");
  });

  it("moveFirst/moveLast jump to the ends", () => {
    const { activeId, moveNext, moveFirst, moveLast } = useActiveDescendant({
      itemIds: computed(() => ["a", "b", "c"]),
    });
    moveNext();
    moveLast();
    expect(activeId.value).toBe("c");
    moveFirst();
    expect(activeId.value).toBe("a");
  });

  it("skips disabled items when moving, and moveFirst/moveLast skip them too", () => {
    const { activeId, moveNext, moveFirst, moveLast } = useActiveDescendant({
      itemIds: computed(() => ["a", "b", "c", "d"]),
      isDisabled: (id) => id === "a" || id === "c",
    });
    moveFirst();
    expect(activeId.value).toBe("b"); // "a" is disabled
    moveNext();
    expect(activeId.value).toBe("d"); // "c" is disabled, skipped
    moveNext(); // wraps back around, skipping "a"
    expect(activeId.value).toBe("b");
    moveLast();
    expect(activeId.value).toBe("d");
  });

  it("stays put (does not throw or clear) when every item is disabled", () => {
    const { activeId, moveNext, moveFirst } = useActiveDescendant({
      itemIds: computed(() => ["a", "b"]),
      isDisabled: () => true,
    });
    moveFirst();
    expect(activeId.value).toBeNull();
    moveNext();
    expect(activeId.value).toBeNull();
  });

  it("handles an empty item list without throwing", () => {
    const { activeId, moveNext, moveFirst, moveLast } = useActiveDescendant({ itemIds: computed(() => []) });
    moveNext();
    moveFirst();
    moveLast();
    expect(activeId.value).toBeNull();
  });

  it("setActive sets directly, bypassing isDisabled, and null clears", () => {
    const { activeId, setActive } = useActiveDescendant({
      itemIds: computed(() => ["a", "b"]),
      isDisabled: () => true,
    });
    setActive("b");
    expect(activeId.value).toBe("b");
    setActive(null);
    expect(activeId.value).toBeNull();
  });

  it("reset clears the active id", () => {
    const { activeId, moveNext, reset } = useActiveDescendant({ itemIds: computed(() => ["a", "b"]) });
    moveNext();
    expect(activeId.value).toBe("a");
    reset();
    expect(activeId.value).toBeNull();
  });

  it("self-heals when the active id falls out of a shrinking/re-filtered itemIds, without a manual watcher", () => {
    const ids = ref(["a", "b", "c"]);
    const { activeId, setActive } = useActiveDescendant({ itemIds: computed(() => ids.value) });
    setActive("b");
    expect(activeId.value).toBe("b");

    ids.value = ["a", "c"]; // "b" filtered out
    expect(activeId.value).toBeNull();

    ids.value = ["a", "b", "c"]; // "b" reappears — resolves again with no extra bookkeeping
    expect(activeId.value).toBe("b");
  });

  it("onKeydown maps ArrowDown/ArrowUp/Home/End and prevents default", () => {
    const { activeId, onKeydown } = useActiveDescendant({ itemIds: computed(() => ["a", "b", "c"]) });

    const down = new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true });
    const preventDown = vi.spyOn(down, "preventDefault");
    onKeydown(down);
    expect(preventDown).toHaveBeenCalled();
    expect(activeId.value).toBe("a");

    const end = new KeyboardEvent("keydown", { key: "End", cancelable: true });
    onKeydown(end);
    expect(activeId.value).toBe("c");

    const home = new KeyboardEvent("keydown", { key: "Home", cancelable: true });
    onKeydown(home);
    expect(activeId.value).toBe("a");

    const up = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    onKeydown(up);
    expect(activeId.value).toBe("c"); // wraps backward from the first item
  });

  it("onKeydown ignores keys it doesn't own (e.g. a plain character, for a consumer's own typeahead)", () => {
    const { activeId, onKeydown } = useActiveDescendant({ itemIds: computed(() => ["a", "b"]) });
    onKeydown(new KeyboardEvent("keydown", { key: "a" }));
    expect(activeId.value).toBeNull();
  });
});
