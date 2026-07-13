/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning can't be exercised here):
 *
 * 1. Hover a trigger — after a brief delay, the tooltip appears anchored
 *    near it and flips to stay in the viewport near an edge.
 * 2. Move the mouse away quickly before the delay elapses — the tooltip
 *    should never appear (no flicker on incidental mouse passes).
 * 3. Tab to a trigger with the keyboard — the tooltip appears immediately
 *    (no delay), and Escape dismisses it without moving focus away.
 * 4. Turn on a screen reader and Tab to a trigger — the description should
 *    be announced.
 */
import { defineComponent, h, nextTick } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Tooltip, { type TooltipProps } from "./Tooltip.vue";
import tooltipSource from "./Tooltip.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderHarness(props: Partial<TooltipProps> = {}) {
  const Harness = defineComponent({
    setup() {
      return () =>
        h(
          Tooltip,
          { content: "Delete this item", ...props },
          { default: () => h("button", "Delete") },
        );
    },
  });
  return render(Harness);
}

/** mouseenter/mouseleave don't bubble, so events must target the wrapping span the listeners are actually on. */
function getTriggerSpan(): HTMLElement {
  return document.querySelector(".stance-tooltip-trigger") as HTMLElement;
}

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders no tooltip content initially", () => {
    renderHarness();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on mouseenter after openDelay, and wires aria-describedby", async () => {
    renderHarness({ openDelay: 400 });
    const trigger = getTriggerSpan();
    expect(trigger).not.toHaveAttribute("aria-describedby");

    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(399);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    vi.advanceTimersByTime(1);
    await nextTick();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Delete this item");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("does not show if the mouse leaves before openDelay elapses", async () => {
    renderHarness({ openDelay: 400 });
    const trigger = getTriggerSpan();

    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(200);
    await fireEvent.mouseLeave(trigger);
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides on mouseleave after closeDelay", async () => {
    renderHarness({ openDelay: 0, closeDelay: 100 });
    const trigger = getTriggerSpan();

    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await fireEvent.mouseLeave(trigger);
    vi.advanceTimersByTime(99);
    await nextTick();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on keyboard focus and hides on blur", async () => {
    renderHarness({ openDelay: 0 });
    const trigger = screen.getByText("Delete");

    await fireEvent.focusIn(trigger);
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await fireEvent.focusOut(trigger);
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides on Escape while visible", async () => {
    renderHarness({ openDelay: 0 });
    const trigger = getTriggerSpan();

    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(0);
    await nextTick();
    // useDismissable defers attaching its keydown listener by one more tick
    // (so the same interaction that opens an overlay isn't also caught by
    // it) — wait for that before dispatching Escape.
    await nextTick();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("never shows when disabled", async () => {
    renderHarness({ openDelay: 0, disabled: true });
    const trigger = getTriggerSpan();

    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("adds tabindex=0 to the trigger only when focusable is true", () => {
    const { unmount } = renderHarness({ focusable: true });
    expect(screen.getByText("Delete").closest("span")).toHaveAttribute("tabindex", "0");
    unmount();

    renderHarness({ focusable: false });
    expect(screen.getByText("Delete").closest("span")).not.toHaveAttribute("tabindex");
  });

  it("warns in dev mode when neither content prop nor content slot is given", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(Tooltip, { slots: { default: "Hover me" } });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires either a `content` prop"));
    errorSpy.mockRestore();
  });

  it("never emits !important in its styles", () => {
    expect(tooltipSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = tooltipSource.slice(tooltipSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-tooltip/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (open)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      renderHarness({ openDelay: 0 });
      const trigger = getTriggerSpan();
      await fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(0);
      await nextTick();

      const tooltipEl = screen.getByRole("tooltip");
      tooltipEl.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") tooltipEl.classList.add("dark");

      // axe-core's own internal async scheduling needs real timers.
      vi.useRealTimers();
      const results = await runAxe(tooltipEl.parentElement!);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  // Targeted palette×density cross-check (design-docs/theme-axes.md §4/D4):
  // color contrast/ARIA don't vary by density, so this isn't a full matrix —
  // just one non-default density paired with the default palette, aimed at
  // catching a component that silently assumed color and density tokens
  // always change together.
  it.each(modes)("no axe violations: neutral palette + compact density (open, %s mode)", async (mode) => {
    const cleanup = withPaletteAndDensityStyle(neutralPalette, compactDensity);
    renderHarness({ openDelay: 0 });
    const trigger = getTriggerSpan();
    await fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(0);
    await nextTick();

    const tooltipEl = screen.getByRole("tooltip");
    tooltipEl.setAttribute("data-theme-palette", "neutral");
    tooltipEl.setAttribute("data-theme-density", "compact");
    if (mode === "dark") tooltipEl.classList.add("dark");

    // axe-core's own internal async scheduling needs real timers.
    vi.useRealTimers();
    const results = await runAxe(tooltipEl.parentElement!);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
