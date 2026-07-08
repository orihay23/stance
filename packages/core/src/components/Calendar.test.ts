import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Calendar, { type CalendarProps, type CalendarRangeValue } from "./Calendar.vue";
import calendarSource from "./Calendar.vue?raw";
import { announce } from "../utils/live-region";
import { runAxe } from "../../tests/axe-matcher";

vi.mock("../utils/live-region", () => ({ announce: vi.fn() }));

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(props: Partial<CalendarProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(props.modelValue);
      const focusedDate = ref(props.focusedDate ?? new Date(2026, 0, 15));
      return () =>
        h(Calendar, {
          ...props,
          modelValue: modelValue.value,
          "onUpdate:modelValue": (v: Date | CalendarRangeValue | undefined) => {
            modelValue.value = v;
          },
          focusedDate: focusedDate.value,
          "onUpdate:focusedDate": (v: Date) => {
            focusedDate.value = v;
          },
        });
    },
  });
  return render(Harness);
}

describe("Calendar", () => {
  it("renders a labeled grid with weekday headers and day cells", () => {
    renderHarness();
    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(27);
  });

  it("only one gridcell is in the tab order at a time (roving tabindex)", () => {
    renderHarness();
    const cells = screen.getAllByRole("gridcell");
    const tabbable = cells.filter((c) => c.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveTextContent("15");
  });

  it("ArrowRight moves the roving tabindex by one day and emits update:focusedDate", async () => {
    renderHarness({ focusedDate: new Date(2026, 0, 15) });
    const grid = screen.getByRole("grid");
    await fireEvent.keyDown(grid, { key: "ArrowRight" });
    await nextTick();
    const tabbable = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("tabindex") === "0");
    expect(tabbable[0]).toHaveTextContent("16");
  });

  it("PageDown/PageUp move by month, Shift+PageDown/PageUp move by year", async () => {
    renderHarness({ focusedDate: new Date(2026, 0, 15) });
    const grid = screen.getByRole("grid");

    await fireEvent.keyDown(grid, { key: "PageDown" });
    await nextTick();
    expect(grid).toHaveAccessibleName(expect.stringContaining("February"));

    await fireEvent.keyDown(grid, { key: "PageUp", shiftKey: true });
    await nextTick();
    expect(grid).toHaveAccessibleName(expect.stringContaining("February 2025"));
  });

  it("Home/End move to the start/end of the focused week", async () => {
    renderHarness({ focusedDate: new Date(2026, 0, 14), firstDayOfWeek: 1 }); // Wed, Monday-start week
    const grid = screen.getByRole("grid");

    await fireEvent.keyDown(grid, { key: "End" });
    await nextTick();
    let tabbable = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("tabindex") === "0");
    expect(tabbable[0]).toHaveTextContent("18"); // Sunday

    await fireEvent.keyDown(grid, { key: "Home" });
    await nextTick();
    tabbable = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("tabindex") === "0");
    expect(tabbable[0]).toHaveTextContent("12"); // Monday
  });

  it("single mode: clicking a day emits update:modelValue with that date", async () => {
    renderHarness({ mode: "single", focusedDate: new Date(2026, 0, 15) });
    const day20 = screen.getByRole("gridcell", { name: "20" });
    await fireEvent.click(day20);
    await nextTick();
    expect(day20).toHaveAttribute("aria-selected", "true");
    expect(day20).toHaveAttribute("data-selected");
  });

  it("Enter selects the focused day (single mode)", async () => {
    renderHarness({ mode: "single", focusedDate: new Date(2026, 0, 15) });
    const grid = screen.getByRole("grid");
    await fireEvent.keyDown(grid, { key: "ArrowRight" });
    await fireEvent.keyDown(grid, { key: "Enter" });
    await nextTick();
    const day16 = screen.getByRole("gridcell", { name: "16" });
    expect(day16).toHaveAttribute("aria-selected", "true");
  });

  it("marks out-of-range days aria-disabled and does not select them on click", async () => {
    renderHarness({
      mode: "single",
      focusedDate: new Date(2026, 0, 15),
      min: new Date(2026, 0, 10),
      max: new Date(2026, 0, 20),
    });
    const day5 = screen.getByRole("gridcell", { name: "5" });
    expect(day5).toHaveAttribute("aria-disabled", "true");

    await fireEvent.click(day5);
    await nextTick();
    expect(day5).not.toHaveAttribute("aria-selected", "true");
  });

  it("range mode: first click sets the start (announced), second click completes the range (announced)", async () => {
    renderHarness({ mode: "range", focusedDate: new Date(2026, 0, 15) });

    const day5 = screen.getByRole("gridcell", { name: "5" });
    await fireEvent.click(day5);
    await nextTick();
    expect(day5).toHaveAttribute("aria-selected", "true");
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("Start date selected"));

    const day10 = screen.getByRole("gridcell", { name: "10" });
    await fireEvent.click(day10);
    await nextTick();
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("Date range selected"));
  });

  it("range mode: picking the end before the start swaps them", async () => {
    renderHarness({ mode: "range", focusedDate: new Date(2026, 0, 15) });
    await fireEvent.click(screen.getByRole("gridcell", { name: "20" }));
    await nextTick();
    await fireEvent.click(screen.getByRole("gridcell", { name: "10" }));
    await nextTick();

    const [start, end] = vi.mocked(announce).mock.calls.at(-1)![0].match(/\d+\/\d+\/\d+/g)!;
    expect(new Date(start!).getDate()).toBe(10);
    expect(new Date(end!).getDate()).toBe(20);
  });

  it("exposes getFocusedCellElement returning the current roving-tabindex cell's DOM element", () => {
    const wrapper = mount(Calendar, { props: { focusedDate: new Date(2026, 0, 15) } });
    const el = wrapper.vm.getFocusedCellElement();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el).toHaveTextContent("15");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = renderHarness({ class: "mt-4" });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-calendar");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in Calendar's styles", () => {
    expect(calendarSource).not.toContain("!important");
  });

  it("wraps Calendar's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = calendarSource.slice(calendarSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-calendar/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderHarness({ focusedDate: new Date(2026, 0, 15) });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
