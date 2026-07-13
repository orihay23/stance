import { defineComponent, h, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import NumberField, { type NumberFieldProps } from "./NumberField.vue";
import numberFieldSource from "./NumberField.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderHarness(props: Partial<NumberFieldProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(props.modelValue);
      return () =>
        h(NumberField, {
          ...props,
          modelValue: modelValue.value,
          "onUpdate:modelValue": (v: number | undefined) => {
            modelValue.value = v;
          },
        });
    },
  });
  return render(Harness);
}

describe("NumberField", () => {
  it("renders role=spinbutton with aria-valuenow/min/max", () => {
    renderHarness({ modelValue: 5, min: 0, max: 10 });
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-valuenow", "5");
    expect(input).toHaveAttribute("aria-valuemin", "0");
    expect(input).toHaveAttribute("aria-valuemax", "10");
  });

  it("uses inputmode=decimal, not a native <input type=number>", () => {
    renderHarness();
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("sets aria-valuetext to the locale-formatted display value", () => {
    renderHarness({ modelValue: 1234.5, locale: "de-DE" });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuetext", "1.234,5");
  });

  it("displays the locale-formatted value, not the raw number", () => {
    renderHarness({ modelValue: 1234.5, locale: "en-US" });
    expect(screen.getByRole("spinbutton")).toHaveValue("1,234.5");
  });

  it("clicking Increase/Decrease steps the value and clamps to min/max", async () => {
    renderHarness({ modelValue: 5, min: 0, max: 6, step: 1 });
    const increase = screen.getByRole("button", { name: "Increase" });
    await fireEvent.pointerDown(increase);
    await fireEvent.pointerUp(increase);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "6");
    expect(increase).toBeDisabled(); // now at max

    const decrease = screen.getByRole("button", { name: "Decrease" });
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    await fireEvent.pointerDown(decrease);
    await fireEvent.pointerUp(decrease);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "0");
    expect(decrease).toBeDisabled(); // now at min
  });

  it("increments from an empty (undefined) value as if starting from 0", async () => {
    renderHarness({ step: 2 });
    await fireEvent.pointerDown(screen.getByRole("button", { name: "Increase" }));
    await fireEvent.pointerUp(screen.getByRole("button", { name: "Increase" }));
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "2");
  });

  it("press-and-hold repeats the step after an initial delay", async () => {
    vi.useFakeTimers();
    try {
      renderHarness({ modelValue: 0 });
      const increase = screen.getByRole("button", { name: "Increase" });
      await fireEvent.pointerDown(increase);
      expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "1"); // fires once immediately

      await vi.advanceTimersByTimeAsync(400); // initial hold delay
      await vi.advanceTimersByTimeAsync(80 * 3); // repeat interval, a few ticks
      expect(Number(screen.getByRole("spinbutton").getAttribute("aria-valuenow"))).toBeGreaterThan(1);

      await fireEvent.pointerUp(increase);
      const valueAtRelease = screen.getByRole("spinbutton").getAttribute("aria-valuenow");
      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", valueAtRelease!);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ArrowUp/ArrowDown step the value", async () => {
    renderHarness({ modelValue: 5, step: 1 });
    const input = screen.getByRole("spinbutton");
    await fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-valuenow", "6");
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-valuenow", "4");
  });

  it("Home/End jump to min/max when they're set", async () => {
    renderHarness({ modelValue: 5, min: 0, max: 10 });
    const input = screen.getByRole("spinbutton");
    await fireEvent.keyDown(input, { key: "End" });
    expect(input).toHaveAttribute("aria-valuenow", "10");
    await fireEvent.keyDown(input, { key: "Home" });
    expect(input).toHaveAttribute("aria-valuenow", "0");
  });

  it("typing a valid locale-formatted value and blurring commits it", async () => {
    renderHarness({ locale: "de-DE" });
    const input = screen.getByRole("spinbutton");
    await fireEvent.update(input, "1.234,5");
    await fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-valuenow", "1234.5");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("typing invalid text marks aria-invalid instead of committing", async () => {
    renderHarness({ modelValue: 5 });
    const input = screen.getByRole("spinbutton");
    await fireEvent.update(input, "not a number");
    await fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-valuenow", "5"); // unchanged
  });

  it("clamps a typed value to min/max on commit", async () => {
    renderHarness({ min: 0, max: 10 });
    const input = screen.getByRole("spinbutton");
    await fireEvent.update(input, "999");
    await fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-valuenow", "10");
  });

  it("clearing the field commits undefined", async () => {
    renderHarness({ modelValue: 5 });
    const input = screen.getByRole("spinbutton");
    await fireEvent.update(input, "");
    await fireEvent.blur(input);
    expect(input).not.toHaveAttribute("aria-valuenow");
  });

  it("does not step when disabled", async () => {
    renderHarness({ modelValue: 5, disabled: true });
    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease" })).toBeDisabled();
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(NumberField, { props: { invalid: true } });
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(NumberField, { props: { invalid: true }, slots: { error: "A value is required" } });
    const input = screen.getByRole("spinbutton");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("A value is required");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(NumberField, { props: { class: "mt-4" } });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-number-field");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(numberFieldSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = numberFieldSource.slice(numberFieldSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-number-field/m);
  });

  it("actually consumes the shared useErrorSlot composable, not a duplicated copy", () => {
    expect(numberFieldSource).toContain('from "../composables/useErrorSlot"');
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(NumberField, {
        props: { modelValue: 5, min: 0, max: 10 },
        attrs: { "aria-label": "Quantity" },
      });
      container.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  // Targeted palette×density cross-check (design-docs/theme-axes.md §4/D4):
  // color contrast/ARIA don't vary by density, so this isn't a full matrix —
  // just one non-default density paired with the default palette, aimed at
  // catching a component that silently assumed color and density tokens
  // always change together.
  it.each(modes)("no axe violations: neutral palette + compact density (%s mode)", async (mode) => {
    const cleanup = withPaletteAndDensityStyle(neutralPalette, compactDensity);
    const { container } = render(NumberField, {
      props: { modelValue: 5, min: 0, max: 10 },
      attrs: { "aria-label": "Quantity" },
    });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
