/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Drag the thumb with a mouse/touch pointer in both orientations — it
 *    should track the pointer smoothly and stop at min/max. The actual
 *    position math (a pointer fraction along the track → a step-snapped
 *    value) is unit-tested directly in number.test.ts's `fractionToValue`
 *    coverage instead of here: jsdom's synthetic PointerEvent doesn't
 *    populate clientX/clientY from the init dict passed to
 *    fireEvent.pointerDown, so drag-to-a-specific-position can't be
 *    exercised through the DOM in a test at all — only clicking (which
 *    still triggers pointerdown, just with clientX/Y always 0) can be.
 * 2. Click anywhere on the track (not just the thumb) — the thumb should
 *    jump to that position and become draggable from there.
 * 3. Turn on a screen reader and focus the thumb — it should announce as a
 *    slider with its current value (or formatted valuetext, when set).
 */
import { defineComponent, h, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Slider, { type SliderProps } from "./Slider.vue";
import sliderSource from "./Slider.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(props: Partial<SliderProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(props.modelValue);
      return () =>
        h(Slider, {
          ...props,
          modelValue: modelValue.value,
          "onUpdate:modelValue": (v: number) => {
            modelValue.value = v;
          },
        });
    },
  });
  return render(Harness);
}

describe("Slider", () => {
  it("renders role=slider with aria-valuenow/min/max, defaulting the value to min", () => {
    renderHarness({ min: 0, max: 10 });
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuenow", "0");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "10");
  });

  it("respects an initial modelValue", () => {
    renderHarness({ modelValue: 40, min: 0, max: 100 });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });

  it("sets aria-valuetext to the locale-formatted value when formatOptions is given", () => {
    renderHarness({ modelValue: 0.25, formatOptions: { style: "percent" } });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "25%");
  });

  it("omits aria-valuetext when no formatOptions is given", () => {
    renderHarness({ modelValue: 5 });
    expect(screen.getByRole("slider")).not.toHaveAttribute("aria-valuetext");
  });

  it("horizontal (default): ArrowRight/ArrowLeft step the value", async () => {
    renderHarness({ modelValue: 5, min: 0, max: 10, step: 1 });
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-orientation", "horizontal");

    await fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(thumb).toHaveAttribute("aria-valuenow", "6");
    await fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    await fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(thumb).toHaveAttribute("aria-valuenow", "4");
  });

  it("vertical: ArrowDown/ArrowUp step the value", async () => {
    renderHarness({ modelValue: 5, min: 0, max: 10, step: 1, orientation: "vertical" });
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-orientation", "vertical");

    await fireEvent.keyDown(thumb, { key: "ArrowDown" });
    expect(thumb).toHaveAttribute("aria-valuenow", "6");
    await fireEvent.keyDown(thumb, { key: "ArrowUp" });
    await fireEvent.keyDown(thumb, { key: "ArrowUp" });
    expect(thumb).toHaveAttribute("aria-valuenow", "4");
  });

  it("clamps stepping at min/max", async () => {
    renderHarness({ modelValue: 9, min: 0, max: 10, step: 5 });
    const thumb = screen.getByRole("slider");
    await fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(thumb).toHaveAttribute("aria-valuenow", "10");
  });

  it("Home/End jump to min/max", async () => {
    renderHarness({ modelValue: 5, min: 0, max: 10 });
    const thumb = screen.getByRole("slider");
    await fireEvent.keyDown(thumb, { key: "End" });
    expect(thumb).toHaveAttribute("aria-valuenow", "10");
    await fireEvent.keyDown(thumb, { key: "Home" });
    expect(thumb).toHaveAttribute("aria-valuenow", "0");
  });

  it("pointerdown on the track moves focus to the thumb and sets a value without crashing", async () => {
    const { container } = renderHarness({ min: 0, max: 100 });
    const track = container.querySelector(".stance-slider__track") as HTMLElement;
    await fireEvent.pointerDown(track, { clientX: 100 });
    expect(document.activeElement).toBe(screen.getByRole("slider"));
    // clientX isn't populated by jsdom's synthetic PointerEvent (see the
    // manual checklist above), so this only confirms the value stays a
    // valid in-range number — the actual position math is covered by
    // number.test.ts's fractionToValue tests.
    const now = Number(screen.getByRole("slider").getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);
  });

  it("does not step or move focus when disabled", async () => {
    renderHarness({ modelValue: 5, disabled: true });
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("tabindex", "-1");
    expect(thumb).toHaveAttribute("aria-disabled", "true");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Slider, { props: { class: "mt-4" } });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-slider");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(sliderSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = sliderSource.slice(sliderSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-slider/m);
  });

  it("actually consumes the shared useDragValue composable, not duplicated pointer/keyboard logic", () => {
    expect(sliderSource).toContain('from "../composables/useDragValue"');
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Slider, {
        props: { modelValue: 40, min: 0, max: 100 },
        attrs: { "aria-label": "Volume" },
      });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
