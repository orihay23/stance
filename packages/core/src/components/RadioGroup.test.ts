/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below — arrow-key navigation between
 * radios is real native browser behavior triggered by sharing a `name`
 * attribute, which jsdom does not simulate, so it can't be covered by an
 * automated jsdom test):
 *
 * 1. Tab into the group — focus lands on the checked radio, or the first
 *    radio if none is checked yet. Only one stop in the tab order for the
 *    whole group (Tab does not visit every radio individually).
 * 2. With a radio focused, press ArrowDown/ArrowRight — focus AND
 *    selection move to the next radio in the group; ArrowUp/ArrowLeft move
 *    to the previous one. A disabled radio is skipped.
 * 3. Tab out of the group, then Tab back in — focus returns to whichever
 *    radio is now selected (roving tabindex), not always the first one.
 * 4. Tab to an invalid group with an error message — a screen reader
 *    announces the error text as part of the group's description.
 * 5. A visible focus ring (using --stance-color-ring) appears around
 *    whichever radio is focused, in every theme, in both light and dark
 *    mode.
 */
import { h } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import RadioGroup from "./RadioGroup.vue";
import Radio from "./Radio.vue";
import radioGroupSource from "./RadioGroup.vue?raw";

import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderGroup(props: Record<string, unknown> = {}, optionCount = 3) {
  return render(RadioGroup, {
    props,
    slots: {
      legend: () => "Choose a plan",
      default: () =>
        Array.from({ length: optionCount }, (_, i) => h(Radio, { value: `option-${i}`, key: i }, () => `Option ${i}`)),
    },
  });
}

describe("RadioGroup", () => {
  it("renders role=radiogroup labelled by the legend slot", () => {
    renderGroup();
    const group = screen.getByRole("radiogroup", { name: "Choose a plan" });
    expect(group).toBeInTheDocument();
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
  });

  it("shares one name across all radios in the group", () => {
    const { container } = renderGroup();
    const names = [...container.querySelectorAll("input[type=radio]")].map((el) => el.getAttribute("name"));
    expect(new Set(names).size).toBe(1);
    expect(names[0]).toBeTruthy();
  });

  it("reflects modelValue as the checked radio", () => {
    renderGroup({ modelValue: "option-1" });
    expect(screen.getByRole("radio", { name: "Option 0" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 2" })).not.toBeChecked();
  });

  it("emits update:modelValue with the clicked radio's value", async () => {
    const { emitted } = renderGroup();
    await fireEvent.click(screen.getByRole("radio", { name: "Option 2" }));
    expect(emitted("update:modelValue")?.[0]).toEqual(["option-2"]);
  });

  it("disables every radio when the group is disabled", () => {
    renderGroup({ disabled: true });
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  it("sets aria-required on the group when required", () => {
    renderGroup({ required: true });
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
  });

  it("sets aria-invalid, without a dangling aria-describedby if there's no error slot", () => {
    renderGroup({ invalid: true });
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(RadioGroup, {
      props: { invalid: true },
      slots: {
        legend: () => "Choose a plan",
        default: () => [h(Radio, { value: "a" }, () => "A")],
        error: () => "You must choose a plan",
      },
    });
    const group = screen.getByRole("radiogroup");
    const describedBy = group.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("You must choose a plan");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = renderGroup({ class: "mt-4" });
    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.className).toContain("stance-radio-group");
    expect(group?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(radioGroupSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = radioGroupSource.slice(radioGroupSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-radio-group/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (default group)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = renderGroup();
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
    const { container } = renderGroup();
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an invalid group with an error message (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(RadioGroup, {
      props: { invalid: true },
      slots: {
        legend: () => "Choose a plan",
        default: () => [h(Radio, { value: "a" }, () => "A"), h(Radio, { value: "b" }, () => "B")],
        error: () => "You must choose a plan",
      },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when a radio in the group is checked (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = renderGroup({ modelValue: "option-1" });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
