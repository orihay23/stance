/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning can't be exercised here):
 *
 * 1. Turn on a screen reader: opening the calendar announces the dialog and
 *    month; arrowing between days announces the date; selecting a day in
 *    range mode announces "choose the end date" then the completed range.
 * 2. Confirm the calendar degrades sensibly (no horizontal overflow) in a
 *    narrow container, e.g. inside a 300px-wide parent.
 * 3. Type a date directly into the input (single mode) and confirm it
 *    commits on blur without ever opening the calendar.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import DatePicker, { type DatePickerProps, type DatePickerRangeValue } from "./DatePicker.vue";
import datePickerSource from "./DatePicker.vue?raw";
import { announce } from "../utils/live-region";
import { runAxe } from "../../tests/axe-matcher";

vi.mock("../utils/live-region", () => ({ announce: vi.fn() }));

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(props: Partial<DatePickerProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(props.modelValue);
      return () =>
        h(DatePicker, {
          ...props,
          modelValue: modelValue.value,
          "onUpdate:modelValue": (v: Date | DatePickerRangeValue | undefined) => {
            modelValue.value = v;
          },
        });
    },
  });
  return render(Harness);
}

async function openCalendar() {
  await fireEvent.click(screen.getByRole("button", { name: "Choose date" }));
  await nextTick();
}

describe("DatePicker", () => {
  it("renders a text input and a trigger button, closed by default", () => {
    renderHarness();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the calendar on trigger click and wires aria-haspopup/expanded/controls", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Choose date" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await openCalendar();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("opens on ArrowDown from the input", async () => {
    renderHarness();
    const input = screen.getByRole("textbox");
    input.focus();
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves focus into the grid on open, onto today when nothing is selected", async () => {
    renderHarness();
    await openCalendar();
    const today = new Date();
    const cell = screen.getByRole("gridcell", { name: String(today.getDate()) });
    expect(document.activeElement).toBe(cell);
  });

  it("only one gridcell is in the tab order at a time (roving tabindex)", async () => {
    renderHarness();
    await openCalendar();
    const cells = screen.getAllByRole("gridcell");
    const tabbable = cells.filter((c) => c.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
  });

  it("single mode: clicking a day selects it and closes the calendar", async () => {
    renderHarness({ mode: "single" });
    await openCalendar();
    const day15 = screen.getByRole("gridcell", { name: "15" });
    await fireEvent.click(day15);
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const today = new Date();
    const expected = new Date(today.getFullYear(), today.getMonth(), 15);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      new Intl.DateTimeFormat("en-US").format(expected),
    );
  });

  it("closes on Escape and returns focus to the trigger button", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Choose date" });
    trigger.focus();
    await openCalendar();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("ArrowRight/ArrowLeft move focus by one day, crossing month boundaries", async () => {
    renderHarness({ modelValue: new Date(2026, 0, 31) });
    await openCalendar();
    const grid = screen.getByRole("grid");
    let active = document.activeElement as HTMLElement;
    expect(active).toHaveTextContent("31");

    await fireEvent.keyDown(grid, { key: "ArrowRight" });
    await nextTick();
    active = document.activeElement as HTMLElement;
    expect(active).toHaveTextContent("1");
    expect(screen.getByRole("dialog")).toHaveAccessibleName(expect.stringContaining("February"));
  });

  it("ArrowUp/ArrowDown move focus by one week", async () => {
    renderHarness({ modelValue: new Date(2026, 0, 14) }); // a Wednesday
    await openCalendar();
    const grid = screen.getByRole("grid");
    await fireEvent.keyDown(grid, { key: "ArrowDown" });
    await nextTick();
    expect(document.activeElement).toHaveTextContent("21");

    await fireEvent.keyDown(grid, { key: "ArrowUp" });
    await nextTick();
    expect(document.activeElement).toHaveTextContent("14");
  });

  it("PageUp/PageDown move by month, Shift+PageUp/PageDown move by year", async () => {
    renderHarness({ modelValue: new Date(2026, 0, 15) });
    await openCalendar();
    const grid = screen.getByRole("grid");

    await fireEvent.keyDown(grid, { key: "PageDown" });
    await nextTick();
    expect(screen.getByRole("dialog")).toHaveAccessibleName(expect.stringContaining("February"));

    await fireEvent.keyDown(grid, { key: "PageUp", shiftKey: true });
    await nextTick();
    expect(screen.getByRole("dialog")).toHaveAccessibleName(expect.stringContaining("February 2025"));
  });

  it("Home/End move to the start/end of the focused week", async () => {
    renderHarness({ modelValue: new Date(2026, 0, 14), firstDayOfWeek: 1 }); // Wed, Monday-start week
    await openCalendar();
    const grid = screen.getByRole("grid");

    await fireEvent.keyDown(grid, { key: "End" });
    await nextTick();
    expect(document.activeElement).toHaveTextContent("18"); // Sunday

    await fireEvent.keyDown(grid, { key: "Home" });
    await nextTick();
    expect(document.activeElement).toHaveTextContent("12"); // Monday
  });

  it("Enter selects the focused day", async () => {
    renderHarness({ mode: "single", modelValue: new Date(2026, 0, 15) });
    await openCalendar();
    const grid = screen.getByRole("grid");
    await fireEvent.keyDown(grid, { key: "ArrowRight" });
    await fireEvent.keyDown(grid, { key: "Enter" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      new Intl.DateTimeFormat("en-US").format(new Date(2026, 0, 16)),
    );
  });

  it("marks out-of-range days aria-disabled and does not select them", async () => {
    renderHarness({ mode: "single", modelValue: new Date(2026, 0, 15), min: new Date(2026, 0, 10), max: new Date(2026, 0, 20) });
    await openCalendar();
    const day5 = screen.getByRole("gridcell", { name: "5" });
    expect(day5).toHaveAttribute("aria-disabled", "true");

    await fireEvent.click(day5);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // still open, selection was a no-op
  });

  it("range mode: first click sets the start and keeps the calendar open; second click completes and closes", async () => {
    renderHarness({ mode: "range" });
    await openCalendar();

    const day5 = screen.getByRole("gridcell", { name: "5" });
    await fireEvent.click(day5);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(day5).toHaveAttribute("aria-selected", "true");
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("Start date selected"));

    const day10 = screen.getByRole("gridcell", { name: "10" });
    await fireEvent.click(day10);
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("Date range selected"));
  });

  it("range mode: picking the end before the start swaps them", async () => {
    renderHarness({ mode: "range" });
    await openCalendar();
    await fireEvent.click(screen.getByRole("gridcell", { name: "20" }));
    await nextTick();
    await fireEvent.click(screen.getByRole("gridcell", { name: "10" }));
    await nextTick();

    const [start, end] = vi.mocked(announce).mock.calls.at(-1)![0].match(/\d+\/\d+\/\d+/g)!;
    expect(new Date(start!).getDate()).toBe(10);
    expect(new Date(end!).getDate()).toBe(20);
  });

  it("range mode: the input is readonly and shows the formatted range", async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 5);
    const end = new Date(today.getFullYear(), today.getMonth(), 10);
    renderHarness({ mode: "range", modelValue: { start, end } });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
    expect(input.value).toContain("–");
  });

  it("single mode: typing a valid date and blurring commits it", async () => {
    renderHarness({ mode: "single" });
    const input = screen.getByRole("textbox");
    await fireEvent.update(input, "3/5/2026");
    await fireEvent.blur(input);
    await nextTick();
    expect((input as HTMLInputElement).value).toBe(new Intl.DateTimeFormat("en-US").format(new Date(2026, 2, 5)));
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("single mode: typing an invalid date marks aria-invalid instead of committing", async () => {
    renderHarness({ mode: "single" });
    const input = screen.getByRole("textbox");
    await fireEvent.update(input, "not a date");
    await fireEvent.blur(input);
    await nextTick();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(DatePicker, { props: { invalid: true } });
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(DatePicker, { props: { invalid: true }, slots: { error: "A date is required" } });
    const input = screen.getByRole("textbox");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toHaveTextContent("A date is required");
  });

  it("does not render or wire the error slot when not invalid", () => {
    render(DatePicker, { props: { invalid: false }, slots: { error: "A date is required" } });
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("A date is required")).not.toBeInTheDocument();
  });

  it("never emits !important in DatePicker's styles", () => {
    expect(datePickerSource).not.toContain("!important");
  });

  it("wraps DatePicker's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = datePickerSource.slice(datePickerSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-date-picker/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (calendar open)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      renderHarness({ modelValue: new Date(2026, 0, 15) });
      await openCalendar();
      const dialog = screen.getByRole("dialog");
      dialog.setAttribute("data-theme", theme.name);
      if (mode === "dark") dialog.classList.add("dark");

      const results = await runAxe(dialog);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
