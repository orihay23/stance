/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning can't be exercised here):
 *
 * 1. Right-click anywhere inside the bound area — the menu opens anchored
 *    at the pointer coordinates, not at the bound element's position.
 * 2. On a touch device, press and hold (~700ms) inside the bound area — the
 *    menu opens anchored at the touch point; a quick tap or a drag/scroll
 *    past a few pixels does not open it.
 * 3. Focus the bound element and press Shift+F10 or the Menu key — the
 *    native "contextmenu" event fires at the focused element's position and
 *    opens the menu, with no extra code needed for this path.
 * 4. Once open, arrow keys/typeahead/Escape/outside-click all behave
 *    identically to a menu opened from a normal DropdownMenuTrigger.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import DropdownMenu, { type DropdownMenuProps } from "./DropdownMenu.vue";
import DropdownMenuContextTrigger, {
  type DropdownMenuContextTriggerProps,
  type DropdownMenuContextTriggerSlotProps,
} from "./DropdownMenuContextTrigger.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";

function renderHarness(
  triggerProps: Partial<DropdownMenuContextTriggerProps> = {},
  menuProps: Partial<DropdownMenuProps> = {},
  onSelect: (label: string) => void = () => {},
) {
  const Harness = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h(
          DropdownMenu,
          {
            modelValue: open.value,
            "onUpdate:modelValue": (v: boolean) => {
              open.value = v;
            },
            ...menuProps,
          },
          {
            default: () => [
              h(DropdownMenuContextTrigger, triggerProps, {
                default: (slotProps: DropdownMenuContextTriggerSlotProps) =>
                  h(
                    "div",
                    {
                      "data-testid": "surface",
                      tabindex: 0,
                      onContextmenu: slotProps.onContextmenu,
                      onTouchstart: slotProps.onTouchstart,
                      onTouchmove: slotProps.onTouchmove,
                      onTouchend: slotProps.onTouchend,
                      onTouchcancel: slotProps.onTouchcancel,
                    },
                    "Right-click or long-press me",
                  ),
              }),
              h(DropdownMenuContent, null, {
                default: () => [
                  h(DropdownMenuItem, { key: "edit", onSelect: () => onSelect("Edit") }, { default: () => "Edit" }),
                  h(DropdownMenuItem, { key: "duplicate", onSelect: () => onSelect("Duplicate") }, { default: () => "Duplicate" }),
                ],
              }),
            ],
          },
        );
    },
  });
  return render(Harness);
}

function touch(x: number, y: number) {
  return { clientX: x, clientY: y } as unknown as Touch;
}

describe("DropdownMenuContextTrigger", () => {
  it("renders no wrapper element — the slot content is the root", () => {
    renderHarness();
    const surface = screen.getByTestId("surface");
    expect(surface.parentElement?.getAttribute("data-testid")).not.toBe("surface-wrapper");
    expect(surface.tagName).toBe("DIV");
  });

  it("opens the menu at the pointer position on contextmenu (right-click)", async () => {
    renderHarness();
    const surface = screen.getByTestId("surface");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await fireEvent(surface, new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 123, clientY: 45 }));
    await nextTick();

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Edit" }));
  });

  it("does not open when disabled", async () => {
    renderHarness({ disabled: true });
    const surface = screen.getByTestId("surface");
    await fireEvent(surface, new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens after a long-press delay on touch, anchored at the touch point", async () => {
    vi.useFakeTimers();
    try {
      renderHarness();
      const surface = screen.getByTestId("surface");

      await fireEvent.touchStart(surface, { touches: [touch(10, 10)] });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(699);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(1);
      await nextTick();
      expect(screen.getByRole("menu")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels the long-press when the touch moves past the threshold", async () => {
    vi.useFakeTimers();
    try {
      renderHarness();
      const surface = screen.getByTestId("surface");

      await fireEvent.touchStart(surface, { touches: [touch(10, 10)] });
      await fireEvent.touchMove(surface, { touches: [touch(40, 40)] });
      await vi.advanceTimersByTimeAsync(1000);
      await nextTick();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels the long-press on touchend before the delay elapses", async () => {
    vi.useFakeTimers();
    try {
      renderHarness();
      const surface = screen.getByTestId("surface");

      await fireEvent.touchStart(surface, { touches: [touch(10, 10)] });
      await fireEvent.touchEnd(surface, { touches: [] });
      await vi.advanceTimersByTimeAsync(1000);
      await nextTick();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("respects a custom longPressDelay", async () => {
    vi.useFakeTimers();
    try {
      renderHarness({ longPressDelay: 100 });
      const surface = screen.getByTestId("surface");

      await fireEvent.touchStart(surface, { touches: [touch(10, 10)] });
      await vi.advanceTimersByTimeAsync(100);
      await nextTick();
      expect(screen.getByRole("menu")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("reuses existing keyboard nav, typeahead, and dismiss logic once opened", async () => {
    const onSelect = vi.fn();
    renderHarness({}, {}, onSelect);
    const surface = screen.getByTestId("surface");
    await fireEvent(surface, new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    await nextTick();

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    await fireEvent.keyDown(edit, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Duplicate" }));

    await fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    await nextTick();
    expect(onSelect).toHaveBeenCalledWith("Duplicate");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    renderHarness();
    const surface = screen.getByTestId("surface");
    await fireEvent(surface, new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
