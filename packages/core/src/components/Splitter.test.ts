/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Drag each divider with a mouse/touch pointer in both orientations — the
 *    adjacent pane pair should resize smoothly and stop at their min/max.
 * 2. Turn on a screen reader and focus a divider — it should announce as a
 *    separator with its current percentage, and arrow keys should visibly
 *    move it.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Splitter, { type SplitterProps } from "./Splitter.vue";
import SplitterPane, { type SplitterPaneProps } from "./SplitterPane.vue";
import splitterSource from "./Splitter.vue?raw";
import splitterPaneSource from "./SplitterPane.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(
  splitterProps: Partial<SplitterProps> = {},
  paneProps: Partial<SplitterPaneProps>[] = [{}, {}, {}],
) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(splitterProps.modelValue);
      return () =>
        h(
          Splitter,
          {
            ...splitterProps,
            modelValue: modelValue.value,
            "onUpdate:modelValue": (v: number[]) => {
              modelValue.value = v;
            },
          },
          {
            default: () =>
              paneProps.map((pane, i) =>
                h(SplitterPane, { ...pane, key: i, dividerLabel: `Resize pane ${i}` }, { default: () => `Pane ${i}` }),
              ),
          },
        );
    },
  });
  return render(Harness);
}

describe("Splitter", () => {
  it("renders one divider fewer than the number of panes", () => {
    renderHarness({}, [{}, {}, {}]);
    expect(screen.getAllByRole("separator")).toHaveLength(2);
  });

  it("splits evenly by default", () => {
    renderHarness({}, [{}, {}]);
    const [divider] = screen.getAllByRole("separator");
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  it("respects an initial modelValue", () => {
    renderHarness({ modelValue: [30, 70] }, [{}, {}]);
    const [divider] = screen.getAllByRole("separator");
    expect(divider).toHaveAttribute("aria-valuenow", "30");
  });

  it("horizontal orientation: divider is aria-orientation vertical, ArrowRight grows the preceding pane", async () => {
    renderHarness({ modelValue: [50, 50], orientation: "horizontal", step: 10 }, [{}, {}]);
    const [divider] = screen.getAllByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "vertical");

    divider.focus();
    await fireEvent.keyDown(divider, { key: "ArrowRight" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "60");

    await fireEvent.keyDown(divider, { key: "ArrowLeft" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  it("vertical orientation: divider is aria-orientation horizontal, ArrowDown/ArrowUp resize", async () => {
    renderHarness({ modelValue: [50, 50], orientation: "vertical", step: 10 }, [{}, {}]);
    const [divider] = screen.getAllByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "horizontal");

    divider.focus();
    await fireEvent.keyDown(divider, { key: "ArrowDown" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "60");

    await fireEvent.keyDown(divider, { key: "ArrowUp" });
    await fireEvent.keyDown(divider, { key: "ArrowUp" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "40");
  });

  it("clamps resize at the preceding pane's max", async () => {
    renderHarness({ modelValue: [50, 50], step: 30 }, [{ max: 60 }, {}]);
    const [divider] = screen.getAllByRole("separator");
    divider.focus();
    await fireEvent.keyDown(divider, { key: "ArrowRight" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "60");
  });

  it("clamps resize at the following pane's min", async () => {
    renderHarness({ modelValue: [50, 50], step: 30 }, [{}, { min: 30 }]);
    const [divider] = screen.getAllByRole("separator");
    divider.focus();
    await fireEvent.keyDown(divider, { key: "ArrowRight" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "70");
  });

  it("Home/End jump to the effective min/max", async () => {
    renderHarness({ modelValue: [50, 50] }, [{ min: 20, max: 80 }, { min: 20, max: 80 }]);
    const [divider] = screen.getAllByRole("separator");
    divider.focus();

    await fireEvent.keyDown(divider, { key: "End" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "80");

    await fireEvent.keyDown(divider, { key: "Home" });
    await nextTick();
    expect(divider).toHaveAttribute("aria-valuenow", "20");
  });

  it("3+ panes: resizing one divider leaves the non-adjacent pane's size untouched", async () => {
    const { getByText } = renderHarness({ modelValue: [20, 30, 50], step: 10 }, [{}, {}, {}]);
    const [firstDivider, secondDivider] = screen.getAllByRole("separator");
    const thirdPane = getByText("Pane 2");
    expect(firstDivider).toHaveAttribute("aria-valuenow", "20");
    expect(secondDivider).toHaveAttribute("aria-valuenow", "30");
    expect(thirdPane).toHaveStyle({ flex: "0 0 50%" });

    firstDivider.focus();
    await fireEvent.keyDown(firstDivider, { key: "ArrowRight" });
    await nextTick();

    // the pair adjacent to the first divider (20/30) grows/shrinks by the
    // step; the third pane, sharing no divider with the first, is untouched.
    expect(firstDivider).toHaveAttribute("aria-valuenow", "30");
    expect(secondDivider).toHaveAttribute("aria-valuenow", "20");
    expect(thirdPane).toHaveStyle({ flex: "0 0 50%" });
  });

  it("labels each divider distinctly via dividerLabel", () => {
    renderHarness({}, [{}, {}, {}]);
    expect(screen.getByRole("separator", { name: "Resize pane 1" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize pane 2" })).toBeInTheDocument();
  });

  it("never emits !important in Splitter or SplitterPane styles", () => {
    expect(splitterSource).not.toContain("!important");
    expect(splitterPaneSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const splitterStyle = splitterSource.slice(splitterSource.indexOf("<style"));
    const paneStyle = splitterPaneSource.slice(splitterPaneSource.indexOf("<style"));
    expect(splitterStyle).not.toMatch(/^\.stance-splitter/m);
    expect(paneStyle).not.toMatch(/^\.stance-splitter/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderHarness();
      const root = container.querySelector(".stance-splitter")!;
      root.setAttribute("data-theme", theme.name);
      if (mode === "dark") root.classList.add("dark");

      const results = await runAxe(root);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
